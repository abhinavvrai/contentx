import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { assetDetails, savedView, stringIds } from "../lib/workspace-model.ts";
const { build } = createRequire(import.meta.resolve("wrangler/package.json"))("esbuild");

const sql=new DatabaseSync(":memory:");
class Statement {
  constructor(query,args=[]){this.query=query;this.args=args;}
  bind(...args){return new Statement(this.query,args);}
  async first(column){const value=sql.prepare(this.query).get(...this.args)||null;return column?value?.[column]:value;}
  async all(){return {results:sql.prepare(this.query).all(...this.args)};}
  async run(){const result=sql.prepare(this.query).run(...this.args);return {meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}};}
}
const db={prepare:q=>new Statement(q),batch:async statements=>{sql.exec("BEGIN");try{const result=statements.map(statement=>{const query=sql.prepare(statement.query);return /\bSELECT\b|\bRETURNING\b|^PRAGMA/i.test(statement.query)?{results:query.all(...statement.args)}:{meta:{changes:Number(query.run(...statement.args).changes)}};});sql.exec("COMMIT");return result;}catch(e){sql.exec("ROLLBACK");throw e;}}};
globalThis.__workspaceTestBindings={DB:db,UPLOADS:{createMultipartUpload:async()=>({uploadId:"local-test-upload",abort:async()=>{}})},CONTENTX_OWNER_TOKEN:"local-test-owner-key-not-production"};
async function bundle(path){const result=await build({entryPoints:[fileURLToPath(new URL(path,import.meta.url))],bundle:true,write:false,format:"esm",platform:"node",plugins:[{name:"bindings",setup(builder){builder.onResolve({filter:/^cloudflare:workers$/},()=>({path:"bindings",namespace:"test"}));builder.onLoad({filter:/.*/,namespace:"test"},()=>({contents:"export const env=globalThis.__workspaceTestBindings"}));}}]});return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);}
const workspace=await bundle("../app/api/workspace/route.ts"),uploads=await bundle("../app/api/uploads/route.ts"),auth=await bundle("../app/api/auth/route.ts");
await (await bundle("../lib/auth.ts")).ensureAccountSchema();
await (await bundle("../lib/uploads.ts")).ensureUploadSchema();
for(const file of ["0009_share_permissions.sql","0010_workspace_records.sql"])sql.exec(readFileSync(new URL(`../drizzle/${file}`,import.meta.url),"utf8"));
const hash=value=>createHash("sha256").update(value).digest("hex");
// Auth uses base64url SHA-256, never return these hashes to the client.
const sessionHash=value=>createHash("sha256").update(value).digest("base64url");
const now=Date.now();
for(const user of ["alice","bob"]){
  sql.prepare("INSERT INTO account_users (id,name,email,password_hash,password_salt,password_iterations,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)").run(user,user,`${user}@example.test`,"not-a-password","salt",100000,now,now);
  sql.prepare("INSERT INTO account_sessions (token_hash,user_id,expires_at,created_at,last_seen_at,user_agent) VALUES (?,?,?,?,?,?)").run(sessionHash(`${user}-token`),user,now+86400000,now,now,"Test browser");
  sql.prepare("INSERT INTO upload_projects (id,name,upload_token_hash,status,max_file_size,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").run(`project_${user}`,`${user} campaign`,hash(user),"active",1000000,now,now);
  sql.prepare("INSERT INTO user_upload_projects (user_id,project_id,razorpay_order_id,created_at) VALUES (?,?,?,?)").run(user,`project_${user}`,`free_${user}`,now);
}
for(const [id,asset,version,user] of [["file1","asset1",1,"alice"],["file2","asset1",2,"alice"],["file3","asset2",1,"alice"],["bobfile","bobasset",1,"bob"]])sql.prepare("INSERT INTO upload_files (id,project_id,object_key,original_name,content_type,size_bytes,status,created_at,completed_at,asset_id,version_number) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(id,`project_${user}`,`private/${id}`,`${id} launch.mp4`,"video/mp4",100,"ready",now,now,asset,version);
function request(path,{user="alice",method="GET",body,token}={}){return new Request(`https://contentx.test${path}`,{method,headers:{origin:"https://contentx.test","Content-Type":"application/json",...(user?{cookie:`cx_session=${user}-token`}:{}),...(token?{authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});}
async function post(module,body,user="alice"){const response=await module.POST(request("/api/workspace",{method:"POST",body,user}));return {status:response.status,body:await response.json()};}

test("organization rejects anonymous and foreign-project access",async()=>{
  assert.equal((await workspace.GET(request("/api/workspace",{user:null}))).status,401);
  assert.equal((await workspace.GET(request("/api/workspace?projectId=project_bob"))).status,404);
});
test("collections persist references, validate assets, and cannot cross account boundaries",async()=>{
  assert.equal((await post(workspace,{kind:"collection",name:"Cross",projectId:"project_alice",assetIds:["bobasset"]})).status,404);
  const created=await post(workspace,{kind:"collection",name:"Client selects",projectId:"project_alice",assetIds:["asset1","asset2"]});assert.equal(created.status,200);assert.deepEqual(created.body.record.payload.assetIds,["asset1","asset2"]);
  const stolen=await post(workspace,{kind:"collection",id:created.body.record.id,name:"Stolen",projectId:"project_bob",assetIds:[]},"bob");assert.equal(stolen.status,404);
  await post(workspace,{action:"remove",id:created.body.record.id},"bob");assert.ok(sql.prepare("SELECT id FROM workspace_records WHERE id=?").get(created.body.record.id));
  const count=sql.prepare("SELECT COUNT(*) AS count FROM upload_files").get().count;await post(workspace,{action:"remove",id:created.body.record.id});assert.equal(sql.prepare("SELECT COUNT(*) AS count FROM upload_files").get().count,count);
});
test("metadata validates fields and saved views normalize unsupported inputs",()=>{
  assert.throws(()=>assetDetails({dueAt:"bad"}));assert.throws(()=>stringIds(Array(101).fill("a")));assert.deepEqual(stringIds(["a","a","b"]),["a","b"]);
  assert.deepEqual(assetDetails({tags:[" Reels ","Reels"],custom:{Campaign:"Launch"}}).tags,["Reels"]);assert.equal(savedView({sort:"injected",type:"script"}).type,"all");assert.equal(savedView({sort:"injected"}).sort,"newest");
});
test("search includes owned comments and files, never another account",async()=>{
  const data=await (await workspace.GET(request("/api/workspace?action=search&q=launch"))).json();assert.equal(data.results.filter(row=>row.kind==="file").length,3);assert.ok(data.results.every(row=>row.project_id==="project_alice"));
  assert.equal((await (await workspace.GET(request("/api/workspace?action=search&q=bob"))).json()).results.length,0);
});
test("templates create folder structures once without duplicating media",async()=>{
  const result=await post(workspace,{action:"template",projectId:"project_alice",template:"reels"});assert.equal(result.status,200);assert.equal(result.body.folderCount,5);
  assert.equal((await post(workspace,{action:"template",projectId:"project_alice",template:"reels"})).status,400);
});
test("session list never exposes auth hashes and revocation cannot end another account's session",async()=>{
  sql.prepare("INSERT INTO account_sessions (token_hash,user_id,expires_at,created_at,last_seen_at,user_agent) VALUES (?,?,?,?,?,?)").run(sessionHash("alice-second"),"alice",now+86400000,now,now,"Second device");
  const data=await (await auth.GET(request("/api/auth?action=sessions"))).json();assert.equal(data.sessions.length,2);assert.equal(data.sessions.filter(row=>row.current).length,1);assert.ok(!JSON.stringify(data).includes(sessionHash("alice-token")));
  const other=data.sessions.find(row=>!row.current);assert.equal((await post(auth,{action:"revoke_sessions",sessionId:other.id},"bob")).status,404);assert.equal((await post(auth,{action:"revoke_sessions",sessionId:other.id})).status,200);assert.equal((await (await auth.GET(request("/api/auth?action=sessions"))).json()).sessions.length,1);
});
test("data export uses explicit columns and excludes credentials, object keys and unrelated projects",async()=>{
  const response=await workspace.GET(request("/api/workspace?action=export"));assert.equal(response.status,200);const body=await response.json(),serialized=JSON.stringify(body);assert.equal(body.projects.length,1);for(const secret of ["password_hash","password_salt","token_hash","private/file1","bob@example.test"])assert.ok(!serialized.includes(secret));
});
test("share history and direct old-version previews enforce previous-version permission",async()=>{
  const share=await post(uploads,{action:"create-share-link",projectId:"project_alice",name:"Latest only",allowPreviousVersions:false,allowDownloads:false,assetIds:["asset1"]});assert.equal(share.status,201);const token=share.body.shareUrl.split("/").pop();
  const history=await uploads.GET(request("/api/uploads?action=versions&projectId=project_alice&assetId=asset1",{user:null,token}));assert.equal(history.status,200);assert.equal((await history.json()).versions.length,1);
  const previous=await uploads.POST(request("/api/uploads",{user:null,token,method:"POST",body:{action:"project-download-link",projectId:"project_alice",fileId:"file1",inline:true}}));assert.equal(previous.status,403);
  const blocked=await uploads.POST(request("/api/uploads",{user:null,token,method:"POST",body:{action:"project-download-link",projectId:"project_alice",fileId:"file3",inline:true}}));assert.equal(blocked.status,403);
});

test("an approval on an older cut cannot mark an unapproved latest cut as approved",async()=>{
  sql.prepare("INSERT INTO project_version_decisions (id,project_id,asset_id,file_id,decision,actor_name,created_at) VALUES (?,?,?,?,?,?,?)").run("oldapproval","project_alice","asset1","file1","approved","Alice",now);
  const result=await post(workspace,{kind:"metadata",projectId:"project_alice",assetId:"asset1",name:"Latest cut",payload:{status:"approved"}});
  assert.equal(result.status,400);
});

test("reopening an approved version requires a reason",async()=>{
  const payload={action:"version-decision",projectId:"project_alice",assetId:"asset1",fileId:"file1",decision:"changes_requested"};
  assert.equal((await post(uploads,payload)).status,400);
  assert.equal((await post(uploads,{...payload,note:"Client supplied a corrected logo."})).status,201);
});

test("session revocation and organization writes reject cross-origin requests",async()=>{
  for(const [module,body] of [[auth,{action:"revoke_sessions",allOthers:true}],[workspace,{kind:"view",name:"Bad origin",payload:{}}]]){
    const req=request("/api/workspace",{method:"POST",body});req.headers.set("origin","https://foreign.example");
    assert.equal((await module.POST(req)).status,403);
  }
});

test("rate limits reject excess requests and keep scopes independent",async()=>{
  const helpers=await bundle("../lib/auth.ts"),req=request("/api/auth");
  await helpers.consumeRequestLimit(req,"fixture-rate",2,60000);await helpers.consumeRequestLimit(req,"fixture-rate",2,60000);
  await assert.rejects(helpers.consumeRequestLimit(req,"fixture-rate",2,60000),error=>error.status===429);
  await helpers.consumeRequestLimit(req,"different-scope",2,60000);
});

test("empty-project file controls are a safe no-op",async()=>{
  const {enhanceFileLibrary}=await import("../public/site/src/studio-workspace.js");
  const grid={querySelectorAll:()=>[]};
  assert.doesNotThrow(()=>enhanceFileLibrary({querySelector:selector=>selector===".workspace-file-grid"?grid:null},[],[]));
});

test("folder move undo persists and refuses to overwrite a later move",async()=>{
  const a=await post(uploads,{action:"create-folder",projectId:"project_alice",name:"Undo A"});
  const b=await post(uploads,{action:"create-folder",projectId:"project_alice",name:"Undo B"});
  const folderId=a.body.folder.id,parentId=b.body.folder.id;
  const move=body=>uploads.PATCH(request("/api/uploads",{method:"PATCH",body:{action:"move-folder",projectId:"project_alice",folderId,...body}}));
  assert.equal((await move({parentId})).status,200);
  assert.equal((await move({parentId:null,expectedParentId:parentId})).status,200);
  assert.equal(sql.prepare("SELECT parent_id FROM project_folders WHERE id=?").get(folderId).parent_id,null);
  assert.equal((await move({parentId:null,expectedParentId:parentId})).status,409);
});

test("file move undo is scoped to the expected destination",async()=>{
  const folder=await post(uploads,{action:"create-folder",projectId:"project_alice",name:"Undo files"});
  const folderId=folder.body.folder.id;
  const move=body=>uploads.PATCH(request("/api/uploads",{method:"PATCH",body:{action:"move-assets",projectId:"project_alice",assetIds:["asset2"],...body}}));
  assert.equal((await move({folderId})).status,200);
  assert.equal((await move({folderId:null,expectedFolderId:folderId})).status,200);
  assert.equal(sql.prepare("SELECT folder_id FROM upload_files WHERE id='file3'").get().folder_id,null);
  assert.equal((await move({folderId:null,expectedFolderId:folderId})).status,409);
});
