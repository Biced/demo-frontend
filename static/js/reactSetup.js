// create navigation links (back to top/go to the last table)
function HelpingLinker(props){
    const isMain = props.isMain // for the main section
    let linkLabel = ""
    let hrefValue = ""
    if (isMain){
        linkLabel = "Go to available contracts listing";
        hrefValue = "available_contract_table"; // make sure to change that when you update the last div
    }else{
        linkLabel = "Go back to top";
        hrefValue = "wrapper"
    }

    return React.createElement(
        "a",
        {href: "#" + hrefValue, className: "text-info"},
        linkLabel
    )
}

function createGraph(props){
    const additionalCls = "cls" in props ? props.cls+ " " : "";
    return React.createElement(
        "i",
        {className: additionalCls + "fas fa-project-diagram"}
    );
}

// create UnorderedList
function UnorderedList(props){
    return React.createElement(
        "ul",
        {className: "list-group list-group-flush"},
        props.listItems && props.listItems.map( (listItem, j) => {  // foreach listItem (expects an array)
            return React.createElement(
                "li",
                {key: j.toString(), className: "list-group list-group-flush"},
                listItem
            );
        })
    )
}

/*********** CALL TRACE COMPONENTS ***********/
// badge by status
function Badge(props){
    let clsName = "";
    switch (props.status) {
        case 'CAST EXPRESSION OVERFLOW':
            clsName = "warning";
            break;
        case 'SUCCESS':
            clsName = "success";
            break;
        case 'REVERT':
            clsName = "warning";
            break;
        case 'THROW':
            clsName = "danger";
            break;
		case 'SUMMARIZED':
			clsName = "w3-container w3-win8-cobalt";
			break;
		case 'DISPATCHER':
			clsName = "w3-container w3-win8-magenta";
			break;
        case 'DEFAULT HAVOC':
			clsName = "danger";
			break;
		case 'REVERT CAUSE':
			clsName = " w3-win8-crimson";
			break;
		case 'DUMP':
			clsName = " w3-win8-crimson";
			break;
        default:
            clsName ="light";
    }

    return React.createElement(
        "span",
        {className: "badge badge-"+clsName},
        props.status
    )
}

// callTrace link
class CallTraceBtn extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentCollapse: ""
        };
    }

    handleClick(e, containerId){
        e.preventDefault();
        // calls 'fathers' onCallTraceClick()
        this.props.onCallTraceClick(e, containerId)
        // this is made for handling "double" click (show/hide the same element)
        if (this.state.currentCollapse == containerId){
            this.setState({currentCollapse: ""})
        }else{
            this.setState({currentCollapse: containerId})
        }
    }

    render() {
        // function does not call any other function <-> hasChildren == false
        const hasChildren = this.props.hasChildren;
        const containerId = this.props.containerId;
        const status = this.props.status;
        const returnValue = ("returnValue" in this.props) ? this.props.returnValue : "";
        const funcName = this.props.funcName;

        let icon = "";
        if (hasChildren){
            icon = React.createElement('i', {className: (this.state.currentCollapse == containerId) ? 'fas fa-arrow-alt-circle-down' : 'fas fa-arrow-alt-circle-right' })
        }

        if (funcName){
            return React.createElement(
                'button',
                { onClick: (e) => this.handleClick(e, containerId),
                  className: 'btn btn-link',
                  type: 'button', 'data-toggle': 'collapse',
                  'data-target': '#'+containerId, 'aria-controls': containerId, 'aria-expanded': 'false', 'aria-label': 'Toggle data', style: !hasChildren ? {marginLeft: "20px", cursor: "auto"} : {}},
                // this is the +/- icon
                icon,
                " "+funcName + (returnValue ? " / " + returnValue : "") + " ",
                React.createElement(Badge, {status: this.props.status}), // status badge
            )
        } else { // in case there was an error
            return React.createElement("span",  {className: "text-danger"}, "ERROR: No function name supplied");
        }
    }
}

// callTrace tree recursive component
class CallTraceTree extends React.Component {
    constructor(props) {
        super(props);
        this.handleCallTraceClicked = this.handleCallTraceClicked.bind(this);
        this.state = {
            clickedCallTrace: '',
            Level: 0
        };
    }

    handleCallTraceClicked(e, containerId) {
        const prevContainerId = this.state.clickedCallTrace;
        //console.log("clicked container id is "+containerId)
        if (prevContainerId == containerId){
            this.setState({clickedCallTrace: ""});
        } else {
            this.setState({clickedCallTrace: containerId});
        }
    }

    hasChildren(node){
        return (node.childrenList && node.childrenList.length);
    }

    render(){
        const level = this.props.level || 0;
        const num = this.props.num || 0;
        const funcName = this.props.funcName || "";
        const containerId = funcName+"-container"+level+"-"+num;
        return React.createElement(
            "div",
            {className: "level level-"+level},
            React.createElement( // current function collapse link
                CallTraceBtn,
                {  num: level,
                   funcName: funcName,
                   containerId: containerId,
                   onCallTraceClick: this.handleCallTraceClicked,
                   hasChildren: this.hasChildren(this.props),
                   //...this.props
                   returnValue: this.props.returnValue,
                   status: this.props.status,
                   childrenList: this.props.childrenList
                }
            ),
            React.createElement( // current function' children (div)
                "div",
                // if user clicked on the current function (to see call trace) show its children
                {id: containerId, className: this.state.clickedCallTrace == containerId ? 'collapse show' : 'collapse'},
                this.props.childrenList && this.props.childrenList.map( (child, i) =>  //foreach child   (...child : send all the child {json}object data to the next component
                    React.createElement( CallTraceTree, Object.assign(child, {key: i.toString(), level: level+1, num: i+1 }) )
                )
            )
        )
    }
}

// callTraceWrapper div
class CallDiv extends React.Component  {
    constructor(props) {
        super(props);
        this.state = {
            isShown: false,
            id: this.props.ruleName + this.props.name + "CallTrace"
        }
    };

    static getDerivedStateFromProps(props, state) {
        //console.log("CallDiv static is called")
        //console.log(props)
        //console.log(state)
        // props are the new props
        // state is current state object
        if (props.isShown != state.isShown) {
            return {
                isShown: props.isShown
            };
        }
        // Return null to indicate no change to state
        return null;
    }

    render(){
        const assertMsg = this.props.assertMsg;
        const failureCauses = this.props.failureCauses;
        const callTrace = this.props.callTrace;
        const variables = this.props.variables;
        const callResolutionTable = this.props.callResolutionTable;
        const callResolutionWarningsTable = this.props.callResolutionWarningsTable;

        let assertMsgOutput = "";
        if (assertMsg){
            if (assertMsg.length > 1){ // for multiple assert messages
                assertMsgOutput = React.createElement(
                    "ol",
                    null,
                    assertMsg.map( (msg, i) =>
                        React.createElement( "li", {key: i.toString()}, msg )
                    )
                )
            } else {
                assertMsgOutput = React.createElement( "p", null, assertMsg )
            }
        }

        let failureCausesOutput = "";

        if (failureCauses){
            failureCausesOutput = React.createElement(
                "div",
                {className: "mb-3"},
				failureCauses.source ? React.createElement("h6", null, "Source Code Location:") : null,
				React.createElement("pre", {className: "text-muted mb-2"},  failureCauses.source ? failureCauses.source : ""),
				React.createElement(ShowDump, {expr: failureCauses.expr})
            );
        }

        return React.createElement(
            "div",
            { id: this.state.id,
              className: "callTraceWrapper " + (this.state.isShown ? "d-block" : "d-none")
            },
            React.createElement("h3", null, this.props.name), // section heading
            assertMsgOutput && React.createElement(
                "h5",
                {className: "text-danger"},
                (assertMsg.length > 1) ? "Multiple Assertion Messages:" : "Assertion Message:"),
            assertMsgOutput,
            failureCauses && React.createElement( "h5", {className: "text-danger"}, "Failure Cause:"),
            failureCausesOutput,
			callResolutionWarningsTable && callResolutionWarningsTable.callResolutionWarnings &&
                callResolutionWarningsTable.callResolutionWarnings.length > 0 &&
                React.createElement("div", null,
                    React.createElement("h5", {className: "text-warning"}, "Contract Call Resolution Warnings:"),
                    React.createElement(Table, {
                        id: "callResolutionWarningsTable",
                        isCallResolutionWarningsSection: true,
                        tableHeader: callResolutionWarningsTable.tableHeader,
                        tableBody: callResolutionWarningsTable.callResolutionWarnings,
                        styleClass: "thead-light"}
                    )
                ),
            React.createElement( // callTrace table and variables
                "div",
                null,
                !isEmpty(callTrace) && React.createElement(Table,
                {  isCallTraceSection: true,
                   tableHeader: ["Call Trace"],
                   tableBody: [{"tableRow": {callTrace: callTrace}}],
                   styleClass: "thead-light"}),
                !isEmpty(variables) && React.createElement(Table,
                {  isCallTraceSection: true,
                   tableHeader: ["Variables"],
                   tableBody: [{"tableRow": {variables: variables}}],
                   styleClass: "thead-light"}
                )
            ),
            callResolutionTable && callResolutionTable.callResolution && callResolutionTable.callResolution.length > 0 &&
            React.createElement("div", null, React.createElement("h5", {className: "text-warning"}, "Contract Call Resolution:"),
			React.createElement(Table, {
                id: "callResolutionTable",
                isCallResolutionSection: true,
                tableHeader: callResolutionTable.tableHeader,
                tableBody: callResolutionTable.callResolution,
                styleClass: "thead-light"}
            )
			)
        );
    }
}

// used for traversing over all the rules/function which has callTrace field (in json file)
class TraversedCallTraces extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clickedLink: ''
        };
    }

    static getDerivedStateFromProps(props, state) {
        //console.log("traverse static is called")
        // used for updating the state
        // Any time user clicks any "flat" rule update state.clickedLink (which causes callTrace open)
        if (props.clickedCallTraceLink != state.clickedLink){
            return { clickedLink: props.clickedCallTraceLink };
        }
        return null;
    }

    render() {
        const isMain = this.props.isMain;
        const ruleName = isMain ? "" : this.props.ruleName;

        return (this.props.results.map( (result, i) => {
            const name = isMain ? result.tableRow.ruleName : result.tableRow.funcName;
            const callTrace = result.callTrace;
            const variables = result.variables;
            const assertMsg = result.assertMessage;
            const failureCauses = result.failureCauses;
			const callResolutionTable = result.callResolutionTable
            const callResolutionWarningsTable = result.callResolutionWarningsTable
            //console.log("From traverse", callTrace)
            // only if there is a callTrace (only in case of "flat" rule or asserted function)
            if (callTrace || variables || assertMsg || failureCauses || callResolutionTable || callResolutionWarningsTable){
                return React.createElement(
                    CallDiv,
                    {  key: i.toString(),
                       num: i, isShown: this.state.clickedLink == name ? true : false,
                       name: name,
                       ruleName: ruleName,
                       callTrace: callTrace,
                       variables: variables,
                       assertMsg: assertMsg,
                       failureCauses: failureCauses,
                       callResolutionTable: callResolutionTable,
					   callResolutionWarningsTable: callResolutionWarningsTable}
                )
            }
            return
          })
        )
    }
}

/*********** TABLE COMPONENTS ***********/
// badge by status
function ResultIcon(current_result){
    let Icon = "";
    let trClass = '';

    /* These are html symbols. Do not remove */
    switch (current_result) {
        case 'SUCCESS':
            trClass = 'table-success';
            Icon = "👍";
            break;
        case 'FAIL':
            trClass = 'table-danger'
            Icon = "👎";
            break;
        case 'SKIPPED':
            trClass = 'table-warning';
            Icon = "↷";//"🔂";
            break;
        case 'ERROR':
            trClass = 'table-danger';
            Icon = "⚠";
            break;
        default:
            trClass = 'table-danger';
            Icon = "❔";
    }

    return {
        Icon: Icon,
        trClass: trClass
    };
}

// create thead element which receives data (in 'props')
function TableHeader(props){
    const width = ["","10%","14%","10%"]
    return React.createElement(
        "thead",
        { className: props.styleClass },
        React.createElement(
            "tr",
            null,
            // foreach heading (expecting an array)
            props.tableHeader.map( (heading, i) => {
                const w = props.isLastSection ||
                          props.isCallResolutionWarningsSection ||
                          props.isCallResolutionSection ? {} : {width: width[i]};
                return React.createElement("th",{key: i.toString(), style: w}, heading);
            })
        )
    );
};

// create links and anchors for table inputs
function TablesLinker(props){
    const isAssert = props.isAssert;
    const isMultiRule = props.isMultiRule;
    const isMultiAssert = props.isMultiAssert;
    const name = props.name;
    const ruleName = props.ruleName ? props.ruleName : "";
    const clsName = "table-link" + (isMultiRule ? "" : " callTracePresentor");
    const hrefValue = ruleName +
                      (isMultiAssert ? "-" : "") +
                      name +
                      (isMultiRule || isMultiAssert ? "Results" : "CallTrace");

    function handleCallTraceClick(e){
        e.preventDefault();
        //console.log("from call link "+ e.target)
        props.onCallTraceLinkClick(e.target.id) // handle click
        const callTraceDivElem = document.getElementById(hrefValue)

        if (callTraceDivElem){
            callTraceDivElem.parentElement.scrollIntoView(); // scroll to the required callTrace div
        }
    }
    // return link to call trace table
    if (isAssert || isMultiRule || isMultiAssert) {
        return React.createElement(
            "a",
            { href: "#" + hrefValue,
              id: name,
              className: clsName,
              onClick: isMultiRule || isMultiAssert ? function(){} : handleCallTraceClick // add handler only for flat rules
            },
            props.name
        )
    }
    // return ruleName/funcName
    return name
}

// table body by section
function TableBody(props){
    const isLastSection = props.isLastSection;
    const isCallResolutionSection = props.isCallResolutionSection;
    const isCallResolutionWarningsSection = props.isCallResolutionWarningsSection;
    const isCallTraceSection = props.isCallTraceSection;
    //let results;
    //console.log(props);
    //console.log("before result:" + isCallResolutionSection + " " + isCallResolutionWarningsSection);
    const results = props.contractResult;
    //console.log("result:" + results);

    return React.createElement(
        "tbody",
        null,
        // foreach Contract result
        results.map( (result, i) => {
            let name = ""
            const properties = [];

            if (isLastSection){ // for available contracts table
                name = result.tableRow.name;
                const address = result.tableRow.address;
                const pre_state = result.tableRow.pre_state;
                const methodsNames = result.tableRow.methodsNames;

                properties.push({property: name});
                properties.push({property: address});
                properties.push({property: pre_state});
                properties.push({listItems: methodsNames});

            }else if (isCallResolutionWarningsSection || isCallResolutionSection){
                const caller = result.tableRow.caller;
                const callee = result.tableRow.callee;
                const summmary = result.tableRow.summmary;
                const comments = result.tableRow.comments;

                properties.push({codeContent: caller});
                properties.push({codeContent: callee});
                properties.push({combination: {summary: summmary, comments: comments}});

            }else if (isCallTraceSection){ // for call trace section
                if ("callTrace" in result.tableRow){
                    properties.push({callTrace: result.tableRow.callTrace});
                } else {
                    properties.push({listItems: getKeyValueList(result.tableRow.variables)});
                }
            } else { // main and sub tables

                name = "ruleName" in result.tableRow ? result.tableRow.ruleName : result.tableRow.funcName;
                const current_result = result.tableRow.result;
                const isMultiRule = "isMultiRule" in result ? result.isMultiRule : false;
                const isMultiAssert = "isMultiAssert" in result ? result.isMultiAssert : false;
                let graph_link = "";
                if ("graph_link" in result.tableRow){
                    if (!isMultiRule && !isMultiAssert && current_result != "SKIPPED"){
                        graph_link = result.tableRow.graph_link;
                    }
                }

                var {Icon, trClass} = ResultIcon(current_result);
                // check the status
                let isAssert = true;
                if ( current_result == "SKIPPED" ){
                    isAssert = false;
                } else if( current_result == "SUCCESS" && !hasContent(result)){
                    isAssert = false;
                }
                properties.push({name: name, isAssert: isAssert, isMultiRule: isMultiRule, isMultiAssert: isMultiAssert});
                properties.push({Icon: Icon, width: "10%"});
                properties.push({property: result.tableRow.time, width: "20%"});
                properties.push({graph_link: graph_link, width: "10%"});
            }

            return React.createElement(
                "tr",
                {
                    key: i.toString(),
                    className: trClass,
                    id: i.toString()
                },
                // build td according to its type
                properties.map( (propertyOb, j) => {
                    let cellContent = ""
                    let width = ("width" in propertyOb) ? propertyOb.width : "";
                    if ("name" in propertyOb){ // for ruleName or funcName which may have a link
                        cellContent = React.createElement( TablesLinker,
                                                            {  isAssert: propertyOb.isAssert,
                                                               isMultiRule: propertyOb.isMultiRule,
                                                               isMultiAssert: propertyOb.isMultiAssert,
                                                               isSub: props.isSub,
                                                               ruleName: props.ruleName,
                                                               name: propertyOb.name,
                                                               onCallTraceLinkClick: props.onCallTraceLinkClick
                                                            })
                    } else if("Icon" in propertyOb){ // for result - Icon
                        cellContent = propertyOb.Icon;
                    } else if("graph_link" in propertyOb){ // for graph link
                        const graphIcon = React.createElement("i", {className: "fas fa-project-diagram"})
                        let href = "#";
                        let target = "";

                        if (propertyOb.graph_link){
                            href = propertyOb.graph_link;
                            target = "_blank";
                            // create link to the graph and add the graph icon
                            cellContent = React.createElement("a",{className: "graph_link", href: href, target: target}, React.createElement(createGraph, null));
                        } else {
                            cellContent = React.createElement(createGraph, {cls: "gray"});
                        }

                    } else if("combination" in propertyOb){
                        cellContent = React.createElement(
                            "div",
                            null,
                            propertyOb.combination.summary,
                            React.createElement(
                                "ul",
                                null,
                                propertyOb.combination.comments && propertyOb.combination.comments.map( (comment, j) => {
                                    return React.createElement(
                                        "li",
                                        {key: j.toString()},
                                        Object.keys(comment),
                                        ": ",
                                        Object.values(comment)
                                        //JSON.stringify(comment)
                                    );
                                })
                            )
                        );
                    } else if("codeContent" in propertyOb){
                        cellContent = React.createElement("code", null, propertyOb.codeContent);
                    } else if("listItems" in propertyOb){ // traverse methods for the available contracts table
                        cellContent = React.createElement(UnorderedList, {listItems: propertyOb.listItems})
                    } else if("callTrace" in propertyOb ){ // traverse methods for the available contracts table
                        cellContent = React.createElement(CallTraceTree, propertyOb.callTrace)
                    }else { // default
                        cellContent = propertyOb.property
                    }

                    return React.createElement(
                        "td",
                        {key: j.toString()},
                        cellContent
                    )
                })
            )
        })
    );
};

// create table with inner thead and tbody elements
class Table extends React.Component {
    render() {
        //console.log(this.props.tableHeader);
        const styleClass = this.props.styleClass;
        return React.createElement(
            "table", // DOM element
            { className: "table table-bordered", id: "id" in this.props ? this.props.id :""}, // bootstrap class
            React.createElement(TableHeader,
                                {tableHeader: this.props.tableHeader,
                                 styleClass: styleClass ? styleClass : "thead-dark",
                                 isLastSection: this.props.isLastSection,
                                 isCallResolutionWarningsSection: this.props.isCallResolutionWarningsSection,
                                 isCallResolutionSection: this.props.isCallResolutionSection}
                               ), // children
            React.createElement(
                TableBody,
                {  isLastSection: this.props.isLastSection,
                   isCallTraceSection: this.props.isCallTraceSection,
                   isCallResolutionSection: this.props.isCallResolutionSection,
                   isCallResolutionWarningsSection: this.props.isCallResolutionWarningsSection,
                   isSub: this.props.isSub,
                   ruleName: this.props.ruleName,
                   contractResult: this.props.tableBody,
                   onCallTraceLinkClick: this.props.onCallTraceLinkClick
                }
            )
        );
    }
}

// create div element with inner table
class TableWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.handleCallTraceLinkClicked = this.handleCallTraceLinkClicked.bind(this);
        this.state = {
            clickedCallTraceLink: ''
        };
    }

    handleCallTraceLinkClicked(clsName) {
        const prevClassName = this.state.clickedCallTraceLink;
        //console.log("clicked class is "+clsName)
        if (prevClassName == clsName){
            //console.log("prev class is "+prevClassName)
            this.setState({clickedCallTraceLink: ""});
        } else {
            this.setState({clickedCallTraceLink: clsName});
        }
    }

    render() {
        //console.log("TableWrapper", this.props);
        let callTraceWrapper = "";
        const isMain = this.props.isMain;
        const isSub = this.props.isSub;

        if (isMain || isSub){
            let results = this.props.tableBody;
            callTraceWrapper = React.createElement(
                                    TraversedCallTraces,
                                    {results: results, isMain: isMain, onAddFunction: this.addFunction, clickedCallTraceLink: this.state.clickedCallTraceLink, ruleName: this.props.ruleName}
                                )
        }
        let default_grid = 6;
        if (this.state.clickedCallTraceLink)
            default_grid = 5;


        return React.createElement(
            "div", // DOM element type
            {className: "row"},
            React.createElement(
                "div",
                {className: this.props.grid ? "col-md-"+this.props.grid : "col-md-" + default_grid},//{num: 6, children: ["h2", Table]},
                React.createElement("h2",{id: "id" in this.props ? this.props.id :""},
                    "resultPrefix" in this.props ? this.props.resultPrefix : "Results for ", this.props.sectionName ,":"),
                React.createElement(HelpingLinker, {isMain: this.props.isMain}), //<a class="text-info" href="#top">Back to top</a>
                React.createElement( // children, the second variable is the data we want to send
                    Table,
                    { isSub: isSub,
                      ruleName: this.props.ruleName,
                      isLastSection: this.props.isLastSection,
                      tableHeader: this.props.tableHeader,
                      tableBody: this.props.tableBody,
                      onCallTraceLinkClick: this.handleCallTraceLinkClicked
                    }
                )
            ),
            // this div will be used for presenting the call trace
            React.createElement(
                "div",
                {className: this.props.grid ? "" : "col-md-" + (12 - default_grid)},
                callTraceWrapper
            )
        );
    }
}

// create div element with inner table
function TraversedSubTables(props){
    const tableHeader = props.sub_tables.tableHeader;
    let resultPrefix = "Results for ";
    if (props.multiAssertTable) {
        resultPrefix = "Assert results for "
    }
    return React.createElement(
        "div",
        null,
        // foreach ruleName (functionResults is per ruleName) we create another sub table
        props.sub_tables.functionResults.map( (sub_table, i) => {
            //console.log("sub_table: "+i+" "+ sub_table.ruleName)
            return React.createElement(
                TableWrapper,
                {  key: i.toString(),
                   sectionName: sub_table.ruleName,
                   id: sub_table.ruleName+"Results",
                   isSub: true,
                   resultPrefix: resultPrefix,
                   tableHeader: tableHeader,
                   tableBody: sub_table.tableBody,
                   ruleName: sub_table.ruleName
                }
            );
        })
    )
}

class ShowDump extends React.Component {
    constructor(props) {
        super(props);
        this.state = { isShown: false };
        this.handleClick = this.handleClick.bind(this);
    }

  render() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "a",
        {type: 'button', 'data-toggle': 'collapse',
         'data-target': '#expression', 'aria-expanded': 'false',
         title: "See the violated condition", onClick:  this.handleClick, href: "#"},
        "see failure dump"
      ),
      React.createElement(
        "div",
        { id: "expression", className: "border collapse" + (this.state.isShown ? " show" : "") },
        React.createElement("p", {className: "p-2 mb-0"}, React.createElement(
                                        "code",
                                        { dangerouslySetInnerHTML: { __html: this.props.expr ? this.props.expr : ""} } ))
      )
    );
  }

  handleClick(e) {
    e.preventDefault();
    this.setState({ isShown: !this.state.isShown });
  }
}

/*********** Helping functions ***********/
function outputErrorMessage(divID, errorMsg){
    var currentDiv = document.getElementById(divID);
    var p = document.createElement("p");
    p.setAttribute('style', 'white-space: pre;');
    p.textContent = "Error occurred: "+ errorMsg;
    p.className = "text-danger";
    currentDiv.appendChild(p);
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

/* Check if callResolutionTable and callResolutionWarningsTable are not empty */
function hasContent(obj){
    let res = false;
    let callResolutionTable = {};
    let callResolutionWarningsTable = {};
    if ("callResolutionTable" in obj){
        callResolutionTable = obj.callResolutionTable;
        if ("callResolution" in callResolutionTable && callResolutionTable.callResolution.length > 0)
            res = true;
    }
    if ("callResolutionWarningsTable" in obj){
        callResolutionWarningsTable = obj.callResolutionWarningsTable;
        if ("callResolutionWarnings" in callResolutionWarningsTable &&
            callResolutionWarningsTable.callResolutionWarnings.length > 0)
            res = true;
    }
    return res;
}

function getKeyValueList(obj){
	var l =[]
    for(k in obj) {
        l.push(k+"="+obj[k])
    }
    return l
}
/*********** Add defined components to the existing DOM elements ***********/
function triggerReact(data){
    // check main table data
    if ("main_table" in data){
        var main_table = data.main_table;
        var contractName = "contractName" in data ? data.contractName : "Contract";
        document.title = contractName;
        // console.log("If contract name replaced with 'Contract', there is a syntax error in data.json, contractName field");
        if ("tableHeader" in main_table && "contractResult" in main_table){
            // create results main table with all the related elements and put them as div#main_table children
            ReactDOM.render(React.createElement(TableWrapper, {sectionName: contractName, tableHeader: data.main_table.tableHeader, tableBody: data.main_table.contractResult, isMain: true}), document.getElementById('main_table'));
        } else {
            outputErrorMessage("main_table","Could not build the main results table.")
        }
    } else {
        outputErrorMessage("main_table","Could not retrieve main table results.")
    }

    // check sub table data
    if ("sub_tables" in data){
        var sub_tables = data.sub_tables;
        if ("tableHeader" in sub_tables && "functionResults" in sub_tables){
            // create sub tables for each invariant
            ReactDOM.render(React.createElement(TraversedSubTables, {sub_tables: sub_tables, multiAssertTable: false}), document.getElementById('sub_tables'));
        } else {
            outputErrorMessage("sub_tables","Could not build the sub table.")
        }
    } else { // TODO: check if there was a multirule
        console.log("sub_table not found");
        //outputErrorMessage("sub_tables","Could not retrieve sub tables results.")
    }

    // check assert table data
    if ("assert_tables" in data){
        var assert_tables = data.assert_tables;
        if ("tableHeader" in assert_tables
            && "functionResults" in assert_tables){
            // create assert tables
            ReactDOM.render(React.createElement(TraversedSubTables, {sub_tables: assert_tables, multiAssertTable: true}), document.getElementById('assert_tables'));
        } else {
            outputErrorMessage("assert_tables","Could not build the assert tables.")
        }
    } else {
        console.log("assert_tables not found");
    }

    // check last section data
    if ("availableContractsTable" in data){
        var contractsTable = data.availableContractsTable;
        var sectionName = "sectionName" in contractsTable ? contractsTable.sectionName : "Available Contracts";
        if ("contractResult" in contractsTable && "tableHeader" in contractsTable){
            // create available contract table
            ReactDOM.render(React.createElement(TableWrapper, {grid: 12, isLastSection: true, sectionName: sectionName, tableHeader: contractsTable.tableHeader, tableBody: contractsTable.contractResult}), document.getElementById('available_contract_table'));
        }
    }
}