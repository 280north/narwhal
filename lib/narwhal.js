
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson

var ARGS = require("narwhal/args");

var parser = exports.parser = new ARGS.Parser();

parser.arg('script').optional();

parser.help(
    'Runs the Narwhal JavaScript interpreter.\n' + 
    'If no script is specified, runs interactively.'
);

parser.option('-e', '-c', '--command', 'command')
    .help("evaluate command")
    .todo("eval", "command")
    .halt();

parser.option('-m', '--module', 'main')
    .help("run a library module as a script")
    .set()
    .halt();

parser.option('-i', '--interactive', 'interactive')
    .help('enter interactive mode after running scripts')
    .set(true)
    .hidden();

var modulesGroup = parser.group('modules');

modulesGroup.option('-r', '--require', 'module')
    .help("pre-load a module")
    .todo("require", "module");

modulesGroup.option('-I', '--include', 'lib')
    .help("add a library")
    .todo("include", "lib");

modulesGroup.option('-p', '--package', 'package', 'packages')
    .help("add a package")
    .push();

modulesGroup.option('-P', '--no-packages', 'noPackages')
    .help("don't load packages")
    .set(true);

modulesGroup.option('-:', '--path', 'delimiter')
    .help("prints an augmented PATH with all package bins/")
    .todo("path", "delimiter");

parser.option('-E', '--no-use-env', 'useEnv')
    .help('ignore environment variables like JS_PATH, NARWHAL_PATH')
    .def(true)
    .set(false)
    .hidden();

parser.option('-d', '--debug', 'debug')
    .help('set debug mode, system.debug = true')
    .inc();

parser.option('-v', '--verbose', 'verbose')
    .help("verbose mode: trace module loads. \0bold(\0green(-vv\0)\0) for all 'require' calls")
    .def(0)
    .inc();

parser.option('-x', '--shebang', 'shebang')
    .help('skip every line before the Unix #!shebang for non-Unix shebangs')
    .set(true)
    .hidden();

parser.option('-u', '--unbuffered')
    .help('unbuffered stdin and stdout; no auto-flush on lines')
    .set(true)
    .hidden();

parser.option('-l', '--log', 'level')
    .help('set the log level')
    .choices({'critical': 0, 'error': 1, 'warn': 2, 'info': 3, 'debug': 4});

parser.option('-V', '--version')
    .help("print Narwhal version number and exit")
    .action(function () {
        this.print("Narwhal Version 0");
        this.exit();
    });

parser.option('--no-term')
    .help("disables terminal coloring (term module)")
    .action(function () {
        require("term").stream.disable();
    });

if (system.setOptimizationLevel) {
    parser.option('-O', 'optimize')
        .help("increase the optimization level (stacks \0bold(\0green(-OO\0)\0))")
        .inc();
    parser.option('-o', 'optimize')
        .help("decrease the optimization level (stacks \0bold(\0green(-oo\0)\0))")
        .dec();
}

parser.option('--narwhal')
    .def('left')
    .choices(['left', 'right'])
    .action(function (options, name, value) {
        this.print(exports[value.toUpperCase()]);
    })
    .halt()
    .hidden();

parser.helpful();

exports.ensureEngine = function(engines) {
    var OS = require("os");
    var FILE = require("file");
    var SYSTEM = require("system");

    if (typeof engines === "string")
        engines = [engines];

    for (var i = 0; i < engines.length; i++)
        if (engines[i] === SYSTEM.engine)
            return;

    SYSTEM.stderr.print('Notice: '+FILE.basename(SYSTEM.args[0])+' is incompatible with "'+SYSTEM.engine+'" engine. '+
        'Automatically running with "'+engines[0]+'" engine instead.');

    OS.exit(OS.system("NARWHAL_ENGINE_HOME='' NARWHAL_ENGINE='"+engines[0]+"' "+
        SYSTEM.args.map(OS.enquote).join(" ")));
};

exports.deprecated = require("narwhal/deprecated").deprecated;

// and now for something completely different

exports.LEFT = "                                                     ,\n                                                  ,f\n                                               ,t,\n                                            ,:L.\n                                           tL,\n                        :EDDEKL         :Lt\n                      DDDDLGKKKK    ,,tD\n                   ,GDDfi.itLKKEKL tEi\n                 DDEEf,,tfLLDEEDL,D\n              .GEDEf,itLLfDLDLDDfD\n            DDEDLf,,fLLGLLDLDti:DL\n          DGDDGL,tttLDLDLfttttiLD\n         GDDLLt,fLLLDLLtLi,ttfLG\n        GGDGt,tLLLDfftii,i,ttLf\n       DGLLtttftftttf,,tttitLt\n      DEtftttLffttttii ttfLfj\n    .DLtittftLftt,,i,,itLfLj\n    DGL;t,tftiti,,,,,,tLLLt\n   DGGttttttii,,,,,:,tttDG\n  ,DLtjtiitii,,:,:,,t ,tG:\n  DDjttttt,ii,,,,:::t:ttL\n ;GLjtttti,i,,, ,,LG,,ft\n DDLttftttti;,,ifDLDtiit\n EGLjtjftt,,,ifLt  DLt,:\n DGfffijittfftt   .DLLt\n:DGfjffftfLft      EEDf\n:EGfftjjLLj         EED\n:DGfLfjLGG          ;E,\n GGfffLLL\n DGffLDf\n DGLfGL.\n fGLfGL\n  DGLDL\n  EGGGG\n   DLGG\n   EGLL\n    ELG\n    EEDKDGEE\n    jKEKKKK\n    EEKKKK\n    DEE\n  .EEKG\n   Lf";
exports.RIGHT = ",\nf,\n  ,t,\n    .L:,\n      ,Lt\n         tL:         LKEDDE:\n            Dt,,    KKKKGLDDDD\n              iEt LKEKKLti.ifDDG,\n                 D,LDEEDLLft,,fEEDD\n                  DfDDLDLDfLLti,fEDEG.\n                  LD:itDLDLLGLLf,,fLDEDD\n                   DLittttfLDLDLttt,LGDDGD\n                    GLftt,iLtLLDLLLf,tLLDDG\n                     fLtt,i,iitffDLLLt,tGDGG\n                      tLtittt,,ftttftftttLLGD\n                       jfLftt iittttffLtttftED\n                        jLfLti,,i,,ttfLtfttitLD.\n                         tLLLt,,,,,,ititft,t;LGD\n                          GDttt,:,,,,,iittttttGGD\n                          :Gt, t,,:,:,,iitiitjtLD,\n                           Ltt:t:::,,,,ii,tttttjDD\n                            tf,,GL,, ,,,i,ittttjLG;\n                            tiitDLDfi,,;ittttfttLDD\n                            :,tLD  tLfi,,,ttfjtjLGE\n                             tLLD.   ttffttijifffGD\n                             fDEE      tfLftfffjfGD:\n                             DEE         jLLjjtffGE:\n                             ,E;          GGLjfLfGD:\n                                           LLLfffGG\n                                            fDLffGD\n                                            .LGfLGD\n                                             LGfLGf\n                                             LDLGD\n                                             GGGGE\n                                             GGLD\n                                             LLGE\n                                             GLE\n                                        EEGDKDEE\n                                         KKKKEKj\n                                          KKKKEE\n                                             EED\n                                             GKEE.\n                                               fL\n";

