import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {mkdir} from "node:fs/promises";
import {fileURLToPath} from "node:url";
const require=createRequire(import.meta.url),{chromium}=require(process.env.BOMBEROS_PLAYWRIGHT_PATH||"playwright");
if(!process.env.BOMBEROS_TEST_PASSWORD)throw Error("Use exclusivamente las cuentas temporales de --preview");
const output=fileURLToPath(new URL("../../tmp/ui/",import.meta.url));await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:"chrome",headless:true}),errors=[];
try{
 for(const username of["member_test_2","member_test_0"]){
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://localhost:3217/login");await page.getByPlaceholder("Tu nombre de usuario").fill(username);await page.locator('input[type="password"]').fill(process.env.BOMBEROS_TEST_PASSWORD);await page.getByRole("button",{name:"Ingresar al Cuartel"}).click();await page.waitForURL(/\/(dashboard|admin)$/);
  if(username==="member_test_2"){
    assert.equal(await page.locator('a[href="/ranking"]').count(),0);
    const requests=[];page.on("request",req=>{if(req.url().includes("/api/ranking"))requests.push(req.url());});
    await page.goto("http://localhost:3217/ranking");await page.getByRole("heading",{name:"Acceso restringido",exact:true}).waitFor();
    assert.equal(await page.getByText("pts",{exact:false}).count(),0);assert.deepEqual(requests,[]);
    await context.close();continue;
  }
  await page.goto("http://localhost:3217/ranking");await page.getByRole("heading",{name:"Ranking de participación",exact:true}).last().waitFor();await page.getByText("Ordenar el salón común",{exact:false}).first().waitFor();
  await page.getByText("Emergencias asistidas",{exact:true}).first().waitFor();await page.getByText("Trabajos realizados",{exact:true}).first().waitFor();
  assert.equal(await page.getByRole("button",{name:"Guardar reglas",exact:true}).count(),username==="member_test_0"?1:0);
  for(const width of[1440,360]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:output+`ranking-${username}-${width}.png`,fullPage:true});}
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log("Ranking UI: usuario y jefatura, PC y 360px, sin desbordes ni errores JavaScript.");
}finally{await browser.close();}
