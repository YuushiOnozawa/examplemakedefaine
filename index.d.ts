/// <reference types="webpack" />
import { Compiler } from "webpack";
export interface IPluginOption {
    wrapModule: boolean;
    name: string;
    out: string;
    exRefrences?: string[] | undefined;
}
export default class SimpleDtsBundlePlugin {
    wrapModule: boolean;
    out: string;
    moduleName: string;
    exRefrences: string[] | undefined;
    importStats: string[];
    importStatekeys: {
        [index: string]: boolean;
    };
    constructor(options: IPluginOption);
    apply(compiler: Compiler): void;
    private make(declarationFiles);
    private makeLines(line);
    private removeExportClass(line);
    private checkLines(line);
    private checkEmptyLine(line);
    private checkExport(line);
    private checkImport(line);
}
