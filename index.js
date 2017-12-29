"use strict";
var SimpleDtsBundlePlugin = /** @class */ (function () {
    function SimpleDtsBundlePlugin(options) {
        this.importStats = [];
        this.importStatekeys = {};
        this.moduleName = options.name;
        this.wrapModule = options.wrapModule ? options.wrapModule : true;
        this.out = options.out ? options.out : './dist/index.d.ts';
        this.exRefrences = options.exRefrences ? options.exRefrences : undefined;
    }
    SimpleDtsBundlePlugin.prototype.apply = function (compiler) {
        var _this = this;
        compiler.plugin('emit', function (compilation, callback) {
            var declarationFiles = {};
            for (var filename in compilation.assets) {
                if (filename.indexOf('.d.ts') !== -1) {
                    declarationFiles[filename] = compilation.assets[filename];
                    delete compilation.assets[filename];
                }
            }
            var combinedDeclaration = _this.make(declarationFiles);
            compilation.assets[_this.out] = {
                source: function () {
                    return combinedDeclaration;
                },
                size: function () {
                    return combinedDeclaration.length;
                }
            };
            callback();
        });
    };
    SimpleDtsBundlePlugin.prototype.make = function (declarationFiles) {
        var declarations = '';
        for (var fileName in declarationFiles) {
            var declarationFile = declarationFiles[fileName];
            var data = declarationFile._value || declarationFile.source();
            var lines = data.split("\n");
            var i = lines.length;
            if (this.wrapModule) {
                while (i--) {
                    lines[i] = this.makeLines(lines[i]);
                }
            }
            declarations += lines.join("\n") + "\n\n";
        }
        return this.wrapModule ?
            this.importStats.join('\n') + "\n\n" + "declare module " + this.moduleName + "\n{\n" + declarations + "}" :
            declarations;
    };
    SimpleDtsBundlePlugin.prototype.makeLines = function (line) {
        line = this.removeExportClass(line);
        var excludeLine = this.checkLines(line);
        if (!excludeLine && this.exRefrences && line.indexOf("<reference") !== -1) {
            excludeLine = this.exRefrences.some(function (reference) { return line.indexOf(reference) !== -1; });
        }
        if (excludeLine) {
            return '';
        }
        return line;
    };
    SimpleDtsBundlePlugin.prototype.removeExportClass = function (line) {
        if (line.indexOf('export') !== -1 &&
            line.indexOf(' from ') === -1 &&
            (line.indexOf('class') !== -1
                || line.indexOf('const') !== -1
                || line.indexOf('interface') !== -1)) {
            return line.replace('export', '');
        }
        return line;
    };
    SimpleDtsBundlePlugin.prototype.checkLines = function (line) {
        var _this = this;
        var checkArrays = [this.checkEmptyLine, this.checkExport, this.checkImport];
        var checkResult = false;
        checkArrays.forEach(function (item) {
            if (!checkResult) {
                checkResult = item.bind(_this, line)();
            }
        }, this);
        return checkResult;
    };
    SimpleDtsBundlePlugin.prototype.checkEmptyLine = function (line) {
        return line === '';
    };
    SimpleDtsBundlePlugin.prototype.checkExport = function (line) {
        return line.indexOf('export') !== -1;
    };
    SimpleDtsBundlePlugin.prototype.checkImport = function (line) {
        // とりあえず完全に同一行だけはじく
        if (line.indexOf('import') !== -1) {
            if (!this.importStatekeys[line]) {
                this.importStatekeys[line] = true;
                this.importStats.push(line);
            }
        }
        return line.indexOf('import') !== -1;
    };
    return SimpleDtsBundlePlugin;
}());
module.exports = SimpleDtsBundlePlugin;
