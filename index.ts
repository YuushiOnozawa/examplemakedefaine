import {Compiler} from "webpack";

export interface IPluginOption {
  wrapModule: boolean;
  name: string;
  outDir: string;
  exRefrences?: string[] | undefined;
}

export default class SimpleDtsBundlePlugin {
  wrapModule: boolean;
  outDir: string;
  moduleName: string;
  exRefrences: string[] | undefined;
  importStats: string[] = [];
  importStatekeys: {[index: string]: boolean} = {};

  constructor(options: IPluginOption ) {
    this.moduleName = options.name;
    this.wrapModule = options.wrapModule ? options.wrapModule : true;
    this.outDir = options.outDir ? options.outDir : './dist/';
    this.exRefrences = options.exRefrences ? options.exRefrences : undefined;
  }

  apply(compiler: Compiler): void {
    compiler.plugin('emit', (compilation: any, callback: any) => {
      let declarationFiles: any = {};
      for (let filename in compilation.assets) {
        if (filename.indexOf('.d.ts') !== -1) {
          declarationFiles[filename] = compilation.assets[filename];
          delete compilation.assets[filename];
        }
      }

      const combinedDeclaration = this.make(declarationFiles);

      compilation.assets[this.outDir] = {
        source: function () {
          return combinedDeclaration;
        },
        size: function () {
          return combinedDeclaration.length;
        }
      };

      callback();
    });
  }

  private make(declarationFiles: any): string {
    let declarations = '';
    for (let fileName in declarationFiles) {
      const declarationFile = declarationFiles[fileName];
      const data = declarationFile._value || declarationFile.source();
      const lines = data.split("\n");
      let i = lines.length;

      while (i--) {
        lines[i] = this.makeLines(lines[i]);
      }
      declarations += lines.join("\n") + "\n\n";
    }

    return this.wrapModule ?
      this.importStats.join('\n') + "\n\n" + "declare module " + this.moduleName + "\n{\n" + declarations + "}" :
      declarations;
  }

  private makeLines(line: string): string | null {
    line = this.removeExportClass(line);
    let excludeLine = this.checkLines(line);

    if (!excludeLine && this.exRefrences && line.indexOf("<reference") !== -1) {
      excludeLine = this.exRefrences.some(reference => line.indexOf(reference) !== -1);
    }

    if (excludeLine) {
      return '';
    }

    return line;
  }

  private removeExportClass(line: string): string  {
    if (line.indexOf('export') !== -1 &&
      line.indexOf(' from ') === -1 &&
      (line.indexOf('class') !== -1
        || line.indexOf('const') !== -1
        || line.indexOf('interface') !== -1)
    ) {
      return line.replace('export', '');
    }

    return line;
  }

  private checkLines(line: string): boolean {
    const checkArrays: Array<(line: string) => boolean> = [this.checkEmptyLine, this.checkExport, this.checkImport];
    let checkResult: boolean = false;
    checkArrays.forEach((item) => {
      if (!checkResult) {
        checkResult = item.bind(this, line)();
      }
    }, this);
    return checkResult;
  }

  private checkEmptyLine(line: string): boolean {
    return line === '';
  }

  private checkExport(line: string): boolean {
    return line.indexOf('export') !== -1;
  }

  private checkImport(line: string): boolean {
    // とりあえず完全に同一行だけはじく
    if(line.indexOf('import') !== -1) {
      if(!this.importStatekeys[line]) {
        this.importStatekeys[line] = true;
        this.importStats.push(line);
      }
    }
    return line.indexOf('import') !== -1;
  }
}
