/// <reference types="webpack" />
import { Compiler } from "webpack";
import { IPluginOption } from "./interfaces";
declare class SimpleDtsBundlePlugin {
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
export = SimpleDtsBundlePlugin;
