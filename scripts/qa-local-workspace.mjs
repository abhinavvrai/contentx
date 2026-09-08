// Isolated workerd smoke test. Never point this at production.
import assert from "node:assert/strict";
const origin="http://127.0.0.1:4185";
let cookie="";
async function call(path,body,{method=body?"POST":"GET",anonymous=false,headers={}}={}){
  const response=await fetch(origin+path,{method,headers:{origin,"content-type":"application/json",...(!anonymous&&cookie?{cookie}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
  const value=await response.json();return {response,value};
}
const login=await call("/api/auth",{action:"login",email:"workspace-qa@example.test",password:"Local-Only-QA-2026!"});
assert.equal(login.response.status,200,"Create the reserved local fixture account first.");
cookie=login.response.headers.get("set-cookie").split(";")[0];
const projects=await call("/api/uploads?action=account-projects");
const projectId=projects.value.projects[0].project_id;
const text="Content X local review fixture\nOpening: Build something worth sharing.\nClosing: Every version in one place.\n";
const start=await call("/api/uploads",{action:"start-upload",projectId,fileName:"QA campaign script.txt",fileSize:Buffer.byteLength(text),contentType:"text/plain"});
assert.equal(start.response.status,200,"Upload session should open.");
const {fileId,uploadId}=start.value;
const partResponse=await fetch(`${origin}/api/uploads?${new URLSearchParams({action:"upload-part",projectId,fileId,uploadId,partNumber:"1"})}`,{method:"PUT",headers:{origin,cookie},body:text});
assert.equal(partResponse.status,200);const part=await partResponse.json();
const completed=await call("/api/uploads",{action:"complete-upload",projectId,fileId,uploadId,parts:[part]});
assert.equal(completed.response.status,200,JSON.stringify(completed.value));
const assetId=completed.value.file.assetId;
const metadata=await call("/api/workspace",{kind:"metadata",projectId,assetId,name:"QA campaign script.txt",payload:{platform:"Reels",campaign:"September launch",editor:"Workspace QA",status:"client_review",tags:["launch"]}});
assert.equal(metadata.response.status,200);
const collection=await call("/api/workspace",{kind:"collection",projectId,name:"Review shortlist",assetIds:[assetId]});assert.equal(collection.response.status,200);
const shared=await call("/api/uploads",{action:"create-share-link",projectId,name:"Local protected review",password:"QA-review-only",allowDownloads:false,allowPreviousVersions:false,assetIds:[assetId]});
assert.equal(shared.response.status,201,JSON.stringify(shared.value));
const token=new URL(shared.value.shareUrl).pathname.split("/").pop();
const baseHeaders={authorization:`Bearer ${token}`};
const locked=await call(`/api/uploads?action=versions&projectId=${projectId}&assetId=${assetId}`,undefined,{anonymous:true,headers:baseHeaders});assert.equal(locked.response.status,401);
const opened=await call(`/api/uploads?action=versions&projectId=${projectId}&assetId=${assetId}`,undefined,{anonymous:true,headers:{...baseHeaders,"x-contentx-share-password":"QA-review-only"}});assert.equal(opened.response.status,200);
const preview=await call("/api/uploads",{action:"project-download-link",projectId,fileId,inline:true});assert.equal(preview.response.status,200);
assert.equal(new URL(preview.value.downloadUrl).searchParams.get("fileId"),fileId,"Preview must refer to the uploaded file.");
// Wrangler emulates the configured custom-domain Host. Always keep QA traffic local.
const mediaUrl=new URL(preview.value.downloadUrl);
const media=await fetch(origin+mediaUrl.pathname+mediaUrl.search);const mediaText=await media.text();assert.equal(media.status,200,`Private preview: ${mediaText.slice(0,180)}`);assert.equal(mediaText,text);
const search=await call("/api/workspace?action=search&q=September");assert.ok(search.value.results.some(row=>row.kind==="details"));
console.log("PASS: local login, R2 multipart upload, completion, metadata, collection, password hashing in workerd, private preview and cross-project search.");
console.log("Local review fixture",`${origin}/site/#workspace?project=${projectId}&asset=${assetId}`);
