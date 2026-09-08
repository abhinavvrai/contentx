import { requireSessionUser, requireSameOrigin, AccountError, ensureAccountSchema } from "../../../lib/auth";
import { ensureUploadSchema, getUploadBindings, json, readJson, cleanText, randomId, ClientError } from "../../../lib/uploads";
import { assetDetails, savedView, stringIds, PROJECT_TEMPLATES } from "../../../lib/workspace-model";

type Input = Record<string, unknown>;
type RecordRow = { id:string; kind:string; name:string; project_id:string|null; payload_json:string; updated_at:number };

async function context(request: Request, projectId = "") {
  await Promise.all([ensureAccountSchema(), ensureUploadSchema()]);
  const user = await requireSessionUser(request);
  const { db } = getUploadBindings();
  if (projectId && !await db.prepare("SELECT project_id FROM user_upload_projects WHERE user_id = ? AND project_id = ?").bind(user.id, projectId).first()) throw new ClientError("Project not found.", 404);
  return { user, db };
}

export async function GET(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const projectId = cleanText(params.get("projectId"), 80);
    const { db, user } = await context(request, projectId);
    if (params.get("action") === "export") {
      const projects=await db.prepare("SELECT p.id,p.name,p.client_name,p.client_email,p.status,p.created_at,p.updated_at FROM upload_projects p JOIN user_upload_projects u ON u.project_id=p.id WHERE u.user_id=?").bind(user.id).all();
      const files=await db.prepare("SELECT f.id,f.project_id,f.asset_id,f.version_number,f.folder_id,f.original_name,f.content_type,f.size_bytes,f.status,f.created_at,f.completed_at FROM upload_files f JOIN user_upload_projects u ON u.project_id=f.project_id WHERE u.user_id=?").bind(user.id).all();
      const folders=await db.prepare("SELECT f.* FROM project_folders f JOIN user_upload_projects u ON u.project_id=f.project_id WHERE u.user_id=?").bind(user.id).all();
      const comments=await db.prepare("SELECT c.id,c.project_id,c.file_id,c.asset_id,c.author_name,c.body,c.timestamp_seconds,c.range_end_seconds,c.status,c.assignee,c.due_at,c.created_at FROM project_review_comments c JOIN user_upload_projects u ON u.project_id=c.project_id WHERE u.user_id=? AND c.deleted_at IS NULL").bind(user.id).all();
      const records=await db.prepare("SELECT kind,name,project_id,payload_json FROM workspace_records WHERE user_id=?").bind(user.id).all();
      return json({exportedAt:new Date().toISOString(),profile:user,projects:projects.results,folders:folders.results,files:files.results,comments:comments.results,savedItems:records.results,mediaIncluded:false});
    }
    if (params.get("action") === "search") return search(db, user.id, params);
    if (params.get("action") === "attention") {
      const rows = await db.prepare(`SELECT c.id, c.project_id, c.asset_id, c.file_id, c.body, c.assignee, c.due_at, c.priority, c.status, p.name AS project_name
        FROM project_review_comments c JOIN user_upload_projects u ON u.project_id = c.project_id JOIN upload_projects p ON p.id = c.project_id
        WHERE u.user_id = ? AND c.deleted_at IS NULL AND c.status NOT IN ('completed','resolved') AND p.status = 'active'
        ORDER BY CASE WHEN c.due_at IS NULL THEN 1 ELSE 0 END, c.due_at, c.created_at DESC LIMIT 50`).bind(user.id).all();
      return json({ items: rows.results });
    }
    const records = await db.prepare(`SELECT id, kind, name, project_id, payload_json, updated_at FROM workspace_records WHERE user_id = ? AND (? = '' OR project_id = ? OR project_id IS NULL) ORDER BY name LIMIT 500`).bind(user.id, projectId, projectId).all<RecordRow>();
    const items=await Promise.all(records.results.map(async row=>{
      const payload=JSON.parse(row.payload_json);
      // A saved label must never overrule a newer decision or unresolved feedback.
      if(row.kind==="metadata" && payload.status==="approved" && !await latestApproved(db,row.project_id||"",payload.assetId))payload.status="changes_requested";
      return {...row,payload,payload_json:undefined};
    }));
    return json({ records:items });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request);
    const input = await readJson<Input>(request);
    const projectId = cleanText(input.projectId, 80);
    const { db, user } = await context(request, projectId);
    const action = cleanText(input.action, 30);
    if (action === "template") return applyTemplate(db, user.id, projectId, input);
    if (action === "remove") {
      await db.prepare("DELETE FROM workspace_records WHERE id = ? AND user_id = ? AND kind IN ('collection','view','favorite','search')").bind(cleanText(input.id, 160), user.id).run();
      return json({ ok:true });
    }
    let kind = cleanText(input.kind, 20), name = cleanText(input.name, 80), payload: unknown, id = cleanText(input.id, 160);
    if (!["collection", "view", "favorite", "metadata", "search"].includes(kind)) throw new ClientError("Choose a valid workspace action.");
    if (!name) throw new ClientError("Enter a name.");
    if (["collection", "metadata"].includes(kind) && !projectId) throw new ClientError("Choose a project.");
    if (kind === "collection") {
      const assetIds = stringIds(input.assetIds);
      await verifyAssets(db, projectId, assetIds);
      payload = { assetIds };
    } else if (kind === "metadata") {
      const assetIds = stringIds([input.assetId]); await verifyAssets(db, projectId, assetIds);
      id = `meta_${user.id}_${assetIds[0]}`;
      payload = { assetId:assetIds[0], ...assetDetails((input.payload || {}) as Input) };
      if ((payload as Input).status === "approved") {
        if (!await latestApproved(db,projectId,assetIds[0])) throw new ClientError("Approve the latest version in the review room first.");
      }
    } else if (kind === "view") payload = savedView((input.payload || {}) as Input);
    else if (kind === "search") payload = { query: cleanText(input.query, 120) };
    else {
      const target = cleanText(input.target, 20), targetId = cleanText(input.targetId, 80);
      if (target === "project") {
        if (targetId !== projectId || !projectId) throw new ClientError("Choose a project.");
      } else if (target === "folder") {
        if (!await db.prepare("SELECT id FROM project_folders WHERE id = ? AND project_id = ?").bind(targetId, projectId).first()) throw new ClientError("Folder not found.",404);
      } else if (target === "asset") await verifyAssets(db, projectId, [targetId]);
      else throw new ClientError("Choose a project, folder or file.");
      id = `fav_${user.id}_${target}_${targetId}`; payload = { target, targetId };
    }
    if (id) {
      const existing = await db.prepare("SELECT user_id, kind, project_id FROM workspace_records WHERE id = ?").bind(id).first<{user_id:string;kind:string;project_id:string|null}>();
      if (existing && (existing.user_id !== user.id || existing.kind !== kind || existing.project_id !== (projectId || null))) throw new ClientError("Workspace item not found.",404);
    } else id = randomId("record");
    const count = await db.prepare("SELECT COUNT(*) AS count FROM workspace_records WHERE user_id = ? AND kind = ?").bind(user.id,kind).first<{count:number}>();
    if ((count?.count || 0) >= 500 && !await db.prepare("SELECT id FROM workspace_records WHERE id = ? AND user_id = ?").bind(id,user.id).first()) throw new ClientError("Remove an unused saved item before adding another.");
    const now = Date.now();
    await db.prepare(`INSERT INTO workspace_records (id,user_id,project_id,kind,name,payload_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name,payload_json=excluded.payload_json,updated_at=excluded.updated_at`).bind(id,user.id,projectId||null,kind,name,JSON.stringify(payload),now,now).run();
    return json({ record:{ id,kind,name,project_id:projectId||null,payload,updated_at:now } });
  });
}

async function verifyAssets(db:D1Database, projectId:string, ids:string[]) {
  if (!ids.length) return;
  const rows = await db.prepare(`SELECT DISTINCT COALESCE(asset_id,id) AS id FROM upload_files WHERE project_id = ? AND status = 'ready' AND COALESCE(asset_id,id) IN (${ids.map(()=>"?").join(",")})`).bind(projectId,...ids).all<{id:string}>();
  if (rows.results.length !== ids.length) throw new ClientError("One or more selected files are unavailable.",404);
}

async function latestApproved(db:D1Database,projectId:string,assetId:string){
  const latest=await db.prepare(`SELECT f.id,
    (SELECT decision FROM project_version_decisions d WHERE d.file_id=f.id ORDER BY d.created_at DESC LIMIT 1) AS decision,
    (SELECT COUNT(*) FROM project_review_comments c WHERE c.file_id=f.id AND c.deleted_at IS NULL AND c.status NOT IN ('completed','resolved')) AS open_count
    FROM upload_files f WHERE f.project_id=? AND COALESCE(f.asset_id,f.id)=? AND f.status='ready' ORDER BY f.version_number DESC,f.created_at DESC LIMIT 1`).bind(projectId,assetId).first<{decision:string;open_count:number}>();
  return latest?.decision==="approved" && Number(latest.open_count)===0;
}

async function applyTemplate(db:D1Database, userId:string, projectId:string, input:Input) {
  if (!projectId) throw new ClientError("Choose a destination project.");
  const existing = await db.prepare("SELECT id FROM project_folders WHERE project_id = ? LIMIT 1").bind(projectId).first();
  if (existing) throw new ClientError("Apply a structure to an empty project so existing folders stay organized.");
  if (!await db.prepare("SELECT id FROM upload_projects WHERE id = ? AND status = 'active'").bind(projectId).first()) throw new ClientError("Reactivate this project first.");
  const sourceId = cleanText(input.sourceProjectId,80);
  let folders: {id:string;parent_id:string|null;name:string;position:number}[] = [];
  if (sourceId) {
    if (sourceId === projectId || !await db.prepare("SELECT project_id FROM user_upload_projects WHERE user_id = ? AND project_id = ?").bind(userId,sourceId).first()) throw new ClientError("Choose one of your other projects.");
    folders = (await db.prepare("SELECT id,parent_id,name,position FROM project_folders WHERE project_id = ? ORDER BY created_at LIMIT 100").bind(sourceId).all<typeof folders[number]>()).results;
  } else {
    const names = PROJECT_TEMPLATES[String(input.template)];
    if (!names) throw new ClientError("Choose a project template.");
    folders = names.map((name,position)=>({id:String(position),parent_id:null,name,position}));
  }
  if (!folders.length) throw new ClientError("This source has no folders to copy.");
  const ids = new Map(folders.map(folder=>[folder.id,randomId("folder")])), now=Date.now();
  await db.batch(folders.map(folder=>db.prepare("INSERT INTO project_folders (id,project_id,parent_id,name,position,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").bind(ids.get(folder.id),projectId,folder.parent_id ? ids.get(folder.parent_id)||null : null,folder.name,folder.position,now,now)));
  return json({ok:true,folderCount:folders.length});
}

async function search(db:D1Database,userId:string,params:URLSearchParams) {
  const q=cleanText(params.get("q"),120), projectId=cleanText(params.get("projectId"),80), type=cleanText(params.get("type"),20);
  if (q.length<2) return json({results:[]});
  const pattern=`%${q.replace(/[\\%_]/g,"\\$&")}%`;
  const results = await db.prepare(`SELECT * FROM (
    SELECT 'project' AS kind,p.id AS project_id,NULL AS asset_id,NULL AS file_id,NULL AS folder_id,NULL AS comment_id,p.name AS title,p.name AS project_name,p.updated_at AS updated_at FROM upload_projects p JOIN user_upload_projects u ON u.project_id=p.id WHERE u.user_id=? AND p.name LIKE ? ESCAPE '\\'
    UNION ALL SELECT 'folder',f.project_id,NULL,NULL,f.id,NULL,f.name,p.name,f.updated_at FROM project_folders f JOIN user_upload_projects u ON u.project_id=f.project_id JOIN upload_projects p ON p.id=f.project_id WHERE u.user_id=? AND f.name LIKE ? ESCAPE '\\'
    UNION ALL SELECT 'file',f.project_id,COALESCE(f.asset_id,f.id),f.id,f.folder_id,NULL,f.original_name,p.name,f.completed_at FROM upload_files f JOIN user_upload_projects u ON u.project_id=f.project_id JOIN upload_projects p ON p.id=f.project_id WHERE u.user_id=? AND f.status='ready' AND f.original_name LIKE ? ESCAPE '\\'
    UNION ALL SELECT 'comment',c.project_id,c.asset_id,c.file_id,NULL,c.id,c.body,p.name,c.updated_at FROM project_review_comments c JOIN user_upload_projects u ON u.project_id=c.project_id JOIN upload_projects p ON p.id=c.project_id WHERE u.user_id=? AND c.deleted_at IS NULL AND (c.body LIKE ? ESCAPE '\\' OR c.author_name LIKE ? ESCAPE '\\')
    UNION ALL SELECT 'details',r.project_id,json_extract(r.payload_json,'$.assetId'),NULL,NULL,NULL,r.name||' · '||r.payload_json,p.name,r.updated_at FROM workspace_records r JOIN upload_projects p ON p.id=r.project_id WHERE r.user_id=? AND r.kind='metadata' AND r.payload_json LIKE ? ESCAPE '\\'
    ) WHERE (?='' OR project_id=?) AND (?='' OR kind=?) ORDER BY updated_at DESC LIMIT 60`).bind(userId,pattern,userId,pattern,userId,pattern,userId,pattern,pattern,userId,pattern,projectId,projectId,type,type).all();
  return json({results:results.results});
}

async function handle(run:()=>Promise<Response>) {
  try { return await run(); }
  catch(error) {
    if(error instanceof ClientError || error instanceof AccountError) return json({error:error.message},error.status);
    if(error instanceof SyntaxError) return json({error:"Enter valid workspace details."},400);
    if(error instanceof Error && /Choose|Use at most|item reference/.test(error.message)) return json({error:error.message},400);
    console.error("Workspace request failed",error);
    return json({error:"The workspace could not save this change. Please retry."},503);
  }
}
