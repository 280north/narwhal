
var args = require("args");

var parser = exports.parser = new args.Parser();

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

modulesGroup.option('-p', '--package', 'prefix', 'prefixes')
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
    .help("verbose mode: trace 'require' calls.")
    .set(true);

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
    .help("print Narwhal version number and exit.")
    .action(function () {
        this.print("Narwhal Version 0.");
        this.exit();
    });

parser.option('-O', 'optimize').inc().hidden();

parser.option('--narwhal')
    .def('left')
    .choices(['left', 'right'])
    .action(function (options, name, value) {
        this.print(exports[value.toUpperCase()]);
    })
    .halt()
    .hidden();

parser.helpful();

// and now for something completely different

exports.LEFT = "                                                     ,\n                                                  ,f\n                                               ,t,\n                                            ,:L.\n                                           tL,\n                        :EDDEKL         :Lt\n                      DDDDLGKKKK    ,,tD\n                   ,GDDfi.itLKKEKL tEi\n                 DDEEf,,tfLLDEEDL,D\n              .GEDEf,itLLfDLDLDDfD\n            DDEDLf,,fLLGLLDLDti:DL\n          DGDDGL,tttLDLDLfttttiLD\n         GDDLLt,fLLLDLLtLi,ttfLG\n        GGDGt,tLLLDfftii,i,ttLf\n       DGLLtttftftttf,,tttitLt\n      DEtftttLffttttii ttfLfj\n    .DLtittftLftt,,i,,itLfLj\n    DGL;t,tftiti,,,,,,tLLLt\n   DGGttttttii,,,,,:,tttDG\n  ,DLtjtiitii,,:,:,,t ,tG:\n  DDjttttt,ii,,,,:::t:ttL\n ;GLjtttti,i,,, ,,LG,,ft\n DDLttftttti;,,ifDLDtiit\n EGLjtjftt,,,ifLt  DLt,:\n DGfffijittfftt   .DLLt\n:DGfjffftfLft      EEDf\n:EGfftjjLLj         EED\n:DGfLfjLGG          ;E,\n GGfffLLL\n DGffLDf\n DGLfGL.\n fGLfGL\n  DGLDL\n  EGGGG\n   DLGG\n   EGLL\n    ELG\n    EEDKDGEE\n    jKEKKKK\n    EEKKKK\n    DEE\n  .EEKG\n   Lf";
exports.RIGHT = ",\nf,\n  ,t,\n    .L:,\n      ,Lt\n         tL:         LKEDDE:\n            Dt,,    KKKKGLDDDD\n              iEt LKEKKLti.ifDDG,\n                 D,LDEEDLLft,,fEEDD\n                  DfDDLDLDfLLti,fEDEG.\n                  LD:itDLDLLGLLf,,fLDEDD\n                   DLittttfLDLDLttt,LGDDGD\n                    GLftt,iLtLLDLLLf,tLLDDG\n                     fLtt,i,iitffDLLLt,tGDGG\n                      tLtittt,,ftttftftttLLGD\n                       jfLftt iittttffLtttftED\n                        jLfLti,,i,,ttfLtfttitLD.\n                         tLLLt,,,,,,ititft,t;LGD\n                          GDttt,:,,,,,iittttttGGD\n                          :Gt, t,,:,:,,iitiitjtLD,\n                           Ltt:t:::,,,,ii,tttttjDD\n                            tf,,GL,, ,,,i,ittttjLG;\n                            tiitDLDfi,,;ittttfttLDD\n                            :,tLD  tLfi,,,ttfjtjLGE\n                             tLLD.   ttffttijifffGD\n                             fDEE      tfLftfffjfGD:\n                             DEE         jLLjjtffGE:\n                             ,E;          GGLjfLfGD:\n                                           LLLfffGG\n                                            fDLffGD\n                                            .LGfLGD\n                                             LGfLGf\n                                             LDLGD\n                                             GGGGE\n                                             GGLD\n                                             LLGE\n                                             GLE\n                                        EEGDKDEE\n                                         KKKKEKj\n                                          KKKKEE\n                                             EED\n                                             GKEE.\n                                               fL\n";

