import { IModelDb, IModelHost, IModelJsFs, SnapshotDb, Subject } from "@bentley/imodeljs-backend";
import * as yargs from "yargs";
import * as path from "path";
import { COBieConnector } from "./COBieConnector";
import { AccessToken, AuthorizedClientRequestContext } from "@bentley/itwin-client";
import { Synchronizer } from "@bentley/imodel-bridge/lib/Synchronizer";
import { BridgeJobDefArgs } from "@bentley/imodel-bridge";

function initOutputFile(fileBaseName: string) {
  const outputDirName = path.join(__dirname, "output");
  if (!IModelJsFs.existsSync(outputDirName)) {
    IModelJsFs.mkdirSync(outputDirName);
  }
  const outputFileName = path.join(outputDirName, fileBaseName);
  if (IModelJsFs.existsSync(outputFileName)) {
    IModelJsFs.removeSync(outputFileName);
  }
  return outputFileName;
}

// npm run start -- --output=p.db
const args = yargs(process.argv.slice(2)).options({output: { type: "string", demandOption: true }}).argv;

(async () => {
  await IModelHost.startup();
  const inputBim = path.join(__dirname  , "./assets/intermediary_v1.db");
  const outName = initOutputFile(args.output);
  const outputBim = SnapshotDb.createEmpty(outName, { rootSubject: { name: "COBieConnector" }, createClassViews: true });
  const connector = new COBieConnector();
  const requestContext = new AuthorizedClientRequestContext(AccessToken.fromTokenString("Bearer test"));
  const sync = new Synchronizer(outputBim, false, requestContext);
  connector.synchronizer = sync;
  const jobSubject = Subject.create(outputBim, IModelDb.rootSubjectId, `COBieConnector:${inputBim}`);
  jobSubject.insert();
  connector.jobSubject = jobSubject;
  await connector.openSourceData(inputBim);
  await connector.onOpenIModel();
  await connector.importDomainSchema(requestContext);
  await connector.importDynamicSchema(requestContext);
  outputBim.saveChanges();
  await connector.importDefinitions();
  outputBim.saveChanges();
  await connector.updateExistingData();
  outputBim.saveChanges();
  const bridgeJobDef = new BridgeJobDefArgs();
  bridgeJobDef.sourcePath = inputBim;
  outputBim.close();
  process.stdout.write(`Output is here: ${  outName  }\n`);
  process.stdout.write(`Upload this .bim file to iModelHub\nDo you want to Edit this iModel....Type  node edit`);
  await IModelHost.shutdown();
})().catch((error) => {
  process.stdout.write(`${error.message}\n${error.stack}\n`);
});
