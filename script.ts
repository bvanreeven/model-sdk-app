import { Model, IModel, domainmodels, IWorkingCopy } from 'mendixmodelsdk';
import { apikeyAccp, apikeyProd, backendUserName, backendPassword, openId } from "./apikeys";

const username = 'benny.van.reeven@mendix.com';

const endPointDM = "http://localhost:8000";
const endPointAccp = "https://model-accp.api.mendix.com";
const endPointProd = "https://model.api.mendix.com";

const apikey = apikeyProd;
const endPoint = endPointProd;

async function main() {
  try {
    const client = Model.createSdkClient({ credentials: { username, apikey }, endPoint });
    // const client = Model.createSdkClient({ credentials: { username: backendUserName, password: backendPassword, openid: openId }, endPoint });

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

    const somePage = model.allPages()[0];
    const page = await wrapPromise(somePage, somePage.load);
    console.log(`Title of page ${page.name} is '${page.title.translations.filter(tr => tr.languageCode === "en_US")[0].text}'`);

    const firstModule = model.allModules()[0];
    const originalName = firstModule.name;
    firstModule.name = "Bloeb";
    firstModule.name = originalName;

    // const domainModel = await new Promise<domainmodels.DomainModel>((resolve, reject) => firstModule.domainModel.load(resolve));
    const domainModel = await wrapPromise(firstModule.domainModel, firstModule.domainModel.load);
    const entity = domainmodels.Entity.createIn(domainModel);
    entity.name = "JeMoeder";

    await new Promise((resolve, reject) => setTimeout(resolve, 300));

    entity.name = "JeVader";
    entity.delete();
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

const http = require("http");
const originalRequest: Function = http.request;
http.request = function (options, callback) {
  console.log(`${options.method} ${options.host}${options.path}`);
  return originalRequest.apply(this, arguments);
};

main();
