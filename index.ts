import {Compiler} from "webpack";


class SimpleDtsBundlePlugin {
  wrapModule: boolean;
  outDir: string;
  moduleName: string;
  exRefrences: string[] | undefined;

  constructor(options: {
    wrapModule: boolean;
    name: string;
    outDir: string;
    exRefrences?: string[] | undefined;
  }) {
    this.moduleName = options.name;
    this.wrapModule = options.wrapModule ? options.wrapModule : true;
    this.outDir = options.outDir ? options.outDir : './dist/';
    this.exRefrences = options.exRefrences ? options.exRefrences : undefined;
  }

  apply(compiler: Compiler): void {
    compiler.plugin('emit', (compilation: any, callback: any) => {
      let declarationFiles: any = {};
      for (var filename in compilation.assets) {
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
        const line = lines[i];
        let excludeLine = this.checkLines(line);

        if (!excludeLine && this.exRefrences && line.indexOf("<reference") !== -1) {
          excludeLine = this.exRefrences.some(reference => line.indexOf(reference) !== -1);
        }

        if (excludeLine) {
          lines.splice(i, 1);
        }
      }
      declarations += lines.join("\n") + "\n\n";
    }

    return this.wrapModule ?
      "declare module " + this.moduleName + "\n{\n" + declarations + "}" :
      declarations;
  }

  private checkLines(line: string): boolean {
    const checkArrays: Array<(line: string) => boolean> = [this.checkEmptyLine, this.checkExport, this.checkImport];
    let checkResult: boolean = false;
    checkArrays.forEach((item) => {
      if (!checkResult) {
        checkResult = item(line);
      }
    });
    return checkResult;
  }

  private checkEmptyLine(line: string): boolean {
    return line === '';
  }

  private checkExport(line: string): boolean {
    return line.indexOf('export') !== -1 && line.indexOf('class') === -1;
  }

  private checkImport(line: string): boolean {
    return line.indexOf('import') !== -1
  }
}

export = SimpleDtsBundlePlugin;