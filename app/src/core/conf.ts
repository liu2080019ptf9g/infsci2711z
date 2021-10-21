// 配置文件辅助类

import { getConfigFilePath, getUserDataDir } from "./path";
import { join } from "path";
import { existsSync } from "fs";
import { app, remote } from "electron";
import { writeText, readText } from "./io";
import { sBackupDir, Languages, sConfigVersion } from "../define";

/**
 * 配置文件的模板
 */
class NaotuConfig {
  //#region properties

  /**
   * 默认保存的目录
   */
  defSavePath?: string;

  /**
   * 最近使用文件列表
   */
  recently?: string[];

  /**
   * 语言
   */
  locale?: Languages;

  /**
   * 是否自动保存
   */
  isAutoSave?: boolean;

  /**
   * 最近文件的数量
   */
  recentMaxNum?: number;

  /**
   * 配置文件的版本
   */
  version?: string;
  //#endregion

  //#region methods
  constructor(
    locale: Languages,
    defSavePath: string,
    isAutoSave: boolean,
    recentMaxNum: number,
    recently: string[],
    version: string
  ) {
    this.locale = locale;
    this.defSavePath = defSavePath;
    this.isAutoSave = isAutoSave;
    this.recentMaxNum = recentMaxNum;
    this.recently = recently;
    this.version = version;
  }

  /**
   * 序列化成字符串
   * @param confModel 配置文件对象
   */
  public static Serialization(confModel: NaotuConfig): string {
    let confJson = JSON.stringify(confModel);

    return confJson;
  }

  /**
   * 反序列化成对象
   * @param confText 配置文件字符串
   */
  public static Deserialization(confText: string): NaotuConfig {
    const confJson = JSON.parse(confText);

    let lang = confJson.locale as Languages;
    let defSavePath = confJson.defSavePath as string;
    let isAutoSave = confJson.isAutoSave as boolean;
    let recentMaxNum = confJson.recentMaxNum as number;
    let recently = confJson.recently as string[];
    let version = confJson.version as string;

    return new NaotuConfig(
      lang,
      defSavePath,
      isAutoSave,
      recentMaxNum,
      recently,
      version
    );
  }
  //#endregion
}

/**
 * 配置文件接口清单
 */
interface IDesktopConfig {
  /**
   * 升级配置文件
   */
  upgrade(): void;

  /**
   * 获取配置文件模板
   */
  getTemplate(): NaotuConfig;

  /**
   * 获取配置文件
   */
  getModel(): NaotuConfig;

  /**
   * 保存配置文件
   * @param config 配置文件
   */
  save(config: NaotuConfig): void;

  /**
   * 创建日志文件
   */
  create(): void;
}

/**
 * 配置文件实现类
 */
export class DesktopConfig implements IDesktopConfig {
  /**
   * 配置文件的路径
   */
  configPath: string;

  constructor() {
    this.configPath = getConfigFilePath();
  }

  create(): void {
    let config = this.getTemplate();
    this.save(config);
  }

  upgrade(): void {
    if (!existsSync(this.configPath)) {
      this.create();
    } else {
      var oldModel = this.getModel();
      var newModel = this.getTemplate();

      // 升级配置
      if (oldModel.version !== newModel.version) {
        if (oldModel.isAutoSave) newModel.isAutoSave = oldModel.isAutoSave;
        if (oldModel.locale) newModel.locale = oldModel.locale;
        if (oldModel.defSavePath) newModel.defSavePath = oldModel.defSavePath;
        if (oldModel.recentMaxNum)
          newModel.recentMaxNum = oldModel.recentMaxNum;
        if (oldModel.recently) newModel.recently = oldModel.recently;

        this.save(newModel);
      }
    }
  }

  getTemplate(): NaotuConfig {
    const savePath = join(getUserDataDir(), sBackupDir);
    let locale = app.getLocale();
    const lang = (locale as Languages) || "en";

    return new NaotuConfig(lang, savePath, true, 5, [], sConfigVersion);
  }

  getModel(): NaotuConfig {
    var data = readText(this.configPath);
    var model = NaotuConfig.Deserialization(data);

    return model;
  }

  save(config: NaotuConfig): void {
    let data = NaotuConfig.Serialization(config);

    writeText(this.configPath, data);
  }
}
