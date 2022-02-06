ace.define("ace/snippets/javascript",["require","exports","module"], function(require, exports, module) {
"use strict";

exports.snippetText = "# Rule\n\
snippet rule\n\
	rule ${1?:rule_name}(${2:argument}) {\n\
		${3:// body...}\n\
	}\n\
# Immediate function\n\
trigger \\(?f\\(\n\
endTrigger \\)?\n\
snippet f(\n\
	(function(${1}) {\n\
		${0:${TM_SELECTED_TEXT:/* code */}}\n\
	}(${1}));\n\
# if\n\
snippet if\n\
	if (${1:true}) {\n\
		${0}\n\
	}\n\
# if ... else\n\
snippet ife\n\
	if (${1:true}) {\n\
		${2}\n\
	} else {\n\
		${0}\n\
	}\n\
# tertiary conditional\n\
snippet ter\n\
	${1:/* condition */} ? ${2:a} : ${3:b}\n\
# switch\n\
snippet switch\n\
	switch (${1:expression}) {\n\
		case '${3:case}':\n\
			${4:// code}\n\
			break;\n\
		${5}\n\
		default:\n\
			${2:// code}\n\
	}\n\
# case\n\
snippet case\n\
	case '${1:case}':\n\
		${2:// code}\n\
		break;\n\
	${3}\n\
\n\
snippet ret\n\
	returns ${1:result}\n\
# for (property in object ) { ... }\n\
snippet fori\n\
	for (var ${1:prop} in ${2:Things}) {\n\
		${0:$2[$1]}\n\
	}\n\
# docstring\n\
snippet /**\n\
	/**\n\
	 * ${1:description}\n\
	 *\n\
	 */\n\
snippet @par\n\
regex /^\\s*\\*\\s*/@(para?m?)?/\n\
	@param {${1:type}} ${2:name} ${3:description}\n\
# require\n\
snippet req\n\
    require ${1};\n\
snippet sta\n\
    static_require ${1};\n\
# assert\n\
snippet stat\n\
    static_assert ${1};\n\
snippet ass\n\
    assert ${1};\n\
";
exports.scope = "spec";

});                (function() {
                    ace.require(["ace/snippets/spec"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            