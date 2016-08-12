'use strict';

let cp = require('child_process');
let fs = require('fs');
let path = require('path');
let EventEmitter = require('events');
let events = new EventEmitter();

/**
 * @description
 * After installing the modules to load the program.
 * 모듈을 모두 설치한 후 프로그램을 로드합니다.
 */
let moduleCount;

let tempLogger = log => {
    let now = new Date();
    let timeFormat = String();
    timeFormat += (String(now.getHours()).length > 1 ? now.getHours() : '0' + now.getHours());
    timeFormat += ':' + (String(now.getMinutes()).length > 1 ? now.getMinutes() : '0' + now.getMinutes());
    timeFormat += ':' + (String(now.getSeconds()).length > 1 ? now.getSeconds() : '0' + now.getSeconds()) + "";
    let defaultFormat = String.fromCharCode(0x1b) + "[31;1m" + "[%time%] " + String.fromCharCode(0x1b) + "[37;1m" + "%log%";
    console.log(defaultFormat.replace('%time%', timeFormat).replace('%log%', log));
}

module.exports = class DeployNPM {
    static get ALL_INSTALLED_EVENT() {
        return "all_installed_event";
    }

    static get INSTALL_START_EVENT() {
        return "install_start_event";
    }

    static get MODULE_INSTALL_START_EVENT() {
        return "module_install_start";
    }

    static get MODULE_INSTALLED_EVENT() {
        return "module_installed_event";
    }

    static get MODULE_INSTALL_ERROR_EVENT() {
        return "module_install_error";
    }

    static get START_CALLBACK_EVENT() {
        return "start_callback_event";
    }

    /**
     * @param {string} event
     * @param {function} listener
     */
    static on(event, listener) {
        events.on(event, listener);
    }

    /**
     * @param {function} startCallback
     */
    static callback(startCallback) {
        DeployNPM.on(DeployNPM.START_CALLBACK_EVENT, startCallback);
    }

    /**
     * @description
     * Automatically install the node modules.
     * @param {boolean} isNeedDefaultProcess
     */
    static automatic(isNeedDefaultProcess) {
        let sourceFolderPath = path.join(process.argv[1], '../');

        if (isNeedDefaultProcess == true || isNeedDefaultProcess == undefined) {
            DeployNPM.on(DeployNPM.INSTALL_START_EVENT,
                (notInstalledModulesList) => {
                    tempLogger(`New node module updates has detected! (total ${notInstalledModulesList.length})`);
                    tempLogger("Application will be started in few seconds later\r\n");
                });
            DeployNPM.on(DeployNPM.MODULE_INSTALL_START_EVENT,
                (moduleName) => {
                    tempLogger(`Downloading module '${moduleName}'...`);
                });
            DeployNPM.on(DeployNPM.MODULE_INSTALLED_EVENT,
                (body) => {
                    tempLogger(`Module installed: ${body}`);
                });
            DeployNPM.on(DeployNPM.ALL_INSTALLED_EVENT,
                () => {
                    tempLogger('All modules prepared. application will be started..');
                });
            DeployNPM.on(DeployNPM.MODULE_INSTALL_ERROR_EVENT,
                (error) => {
                    tempLogger('An error occurred while preparing a base module.');
                    tempLogger('Can not execute the program. The base module was not prepared.');
                    tempLogger(error);
                    process.exit();
                });
        }
        DeployNPM.collectPackageList(sourceFolderPath);
    }

    /**
     * @param {string} body
     */
    static modulesInstallChecker(body) {
        events.emit(DeployNPM.MODULE_INSTALLED_EVENT, body);
        if (moduleCount != 0)
            if (--moduleCount == 0) {
                events.emit(DeployNPM.ALL_INSTALLED_EVENT);
                events.emit(DeployNPM.START_CALLBACK_EVENT);
            }
    };

    /**
     * @param {string} packageName
     * @param {string} sourceFolderPath
     * @param {boolean} isNeedToPassVersionCheck
     * @return {boolean}
     */
    static isModuleExist(packageName, sourceFolderPath, isNeedToPassVersionCheck) {
        let packageList, packageVersion;

        if (sourceFolderPath === undefined)
            sourceFolderPath = path.join(process.argv[1], '../');

        if ((isNeedToPassVersionCheck == false || isNeedToPassVersionCheck === undefined) && sourceFolderPath !== null) {
            packageList = require(path.join(sourceFolderPath, 'package.json'));
        }
        let baseCache = {};

        for (let key in require.cache) baseCache[key] = true;

        if ((isNeedToPassVersionCheck == false || isNeedToPassVersionCheck === undefined) && sourceFolderPath !== null) {
            packageVersion = packageList.dependencies[packageName];
            if(packageVersion != null)
              packageVersion = packageVersion.replace(/[&\/\\#,+()$~%;@$^!'":*?<>{}]/g, '');
        }

        let loadTest, loadVersion;
        try {
            loadTest = require(path.join(sourceFolderPath, `node_modules/${packageName}`));
            if ((isNeedToPassVersionCheck == false || isNeedToPassVersionCheck === undefined) && sourceFolderPath !== null) {
                loadVersion = require(path.join(sourceFolderPath, `node_modules/${packageName}/package.json`)).version;
                loadVersion = loadVersion.replace(/[&\/\\#,+()$~%;@$^!'":*?<>{}]/g, '');
                if (packageVersion != null && packageVersion != loadVersion) return false;
            }
        } catch (e) {
            try {
                loadTest = require(packageName);
            } catch (e) {
                if (!loadTest) return false;
            }
        }

        for (let key in require.cache)
            if (!baseCache[key]) delete require.cache[key];
        baseCache = null;

        return true;
    }

    /**
     * @param {string} moduleName
     */
    static moduleInstall(moduleName) {
        cp.exec(`npm install ${moduleName}`, (error, body) => {
            if (error) {
                events.emit(DeployNPM.MODULE_INSTALL_ERROR_EVENT, error);
                return;
            }
            DeployNPM.modulesInstallChecker(body);
        });
    }

    static collectPackageList(sourceFolderPath) {
        let packageList = require(path.join(sourceFolderPath, 'package.json'));

        let notInstalledModules = [];
        let baseCache = {};

        for (let key in require.cache) baseCache[key] = true;

        for (let packageName in packageList.dependencies) {
            if (!DeployNPM.isModuleExist(packageName, sourceFolderPath))
                notInstalledModules.push(packageName);
        }
        moduleCount = notInstalledModules.length;

        for (let key in require.cache)
            if (!baseCache[key]) delete require.cache[key];
        baseCache = null;

        /**
         * @description
         * If the node module is not ready then automatically
         * download and install the node module and turn on the server.
         * 노드 모듈이 준비되어있지 않은 경우 노드모듈을
         * 자동으로 다운로드 및 설치한 후 서버를 켭니다.
         */
        if (notInstalledModules.length > 0) {
            events.emit(DeployNPM.INSTALL_START_EVENT, notInstalledModules);
            notInstalledModules.forEach(moduleName => {
                events.emit(DeployNPM.MODULE_INSTALL_START_EVENT, moduleName);
                DeployNPM.moduleInstall(moduleName);
            });
        } else {
            events.emit(DeployNPM.START_CALLBACK_EVENT);
        }
    }
}
