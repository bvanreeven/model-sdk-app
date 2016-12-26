import { Model, IModel, domainmodels, IWorkingCopy } from 'mendixmodelsdk';
import { apikeyAccp, apikeyProd } from "./apikeys";

const username = 'benny.van.reeven@mendix.com';

const endPointAccp = "https://model-accp.api.mendix.com";
const endPointProd = "https://model.api.mendix.com";

const apikey = apikeyProd;
const endPoint = endPointProd;

async function main() {
  try {
    const client = Model.createSdkClient({ credentials: { username, apikey }, endPoint });

    const workingCopies = await wrapPromise(client, client.getMyWorkingCopies);
    // const workingCopies = await new Promise<IWorkingCopy[]>((resolve, reject) => client.getMyWorkingCopies(resolve, reject));
    // const workingCopies = await new Promise<IWorkingCopy[]>(client.getMyWorkingCopies.bind(client));
    console.log("My working copies:");
    workingCopies.forEach(wc => console.log(` * ${wc.id}: ${wc.mprFileName}`));

    const workingCopyId = workingCopies[0].id;

    const model = await wrapPromise1(client, client.openWorkingCopy, workingCopyId);
    console.log(`Modules (with their entities) in working copy ${workingCopyId}:`);
    model.allModules().forEach(module => {
      console.log(` * ${module.name}`);
      module.domainModel.entities.forEach(entity => {
        console.log(`   * Entity '${entity.name}'`);
      });
    });

    const firstModule = model.allModules()[0];
    const originalName = firstModule.name;
    firstModule.name = "Bloeb";
    firstModule.name = originalName;

    // const domainModel = await new Promise<domainmodels.DomainModel>((resolve, reject) => firstModule.domainModel.load(resolve));
    const domainModel = await wrapPromise(firstModule.domainModel, firstModule.domainModel.load);
    const entity = domainmodels.Entity.createIn(domainModel);
    entity.name = "JeMoeder";

    setTimeout(() => {
      entity.name = "JeVader";
      entity.delete();
    }, 300);
  }
  catch (error) {
    console.log('Something went wrong:');
    console.dir(error);
  }
}

function wrapPromise<T>(thisScope: any, action: (callback: (value: T) => void, errorCallback: (err: any) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    action.bind(thisScope)(resolve, reject);
  });
}

function wrapPromise1<T, P1>(thisScope: any, action: (param: P1, callback: (value: T) => void, errorCallback: (err: any) => void) => void, param: P1): Promise<T> {
  return new Promise((resolve, reject) => {
    action.bind(thisScope)(param, resolve, reject);
  });
}

const https = require("https");
const originalRequest: Function = https.request;
https.request = function(options, callback) {
  console.log("HTTPS request fired!");
  console.dir(options);
  return originalRequest.apply(this, arguments);
};

main();
