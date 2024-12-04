import ConditionalEdge from "@specs-feup/clava-flow/cfg/edge/ConditionalEdge";
import BreakNode from "@specs-feup/clava-flow/cfg/node/BreakNode";
import CommentNode from "@specs-feup/clava-flow/cfg/node/CommentNode";
import ContinueNode from "@specs-feup/clava-flow/cfg/node/ContinueNode";
import DoWhileNode from "@specs-feup/clava-flow/cfg/node/DoWhileNode";
import EmptyStatementNode from "@specs-feup/clava-flow/cfg/node/EmptyStatementNode";
import ExpressionNode from "@specs-feup/clava-flow/cfg/node/ExpressionNode";
import ForEachNode from "@specs-feup/clava-flow/cfg/node/ForEachNode";
import ForNode from "@specs-feup/clava-flow/cfg/node/ForNode";
import GotoLabelNode from "@specs-feup/clava-flow/cfg/node/GotoLabelNode";
import GotoNode from "@specs-feup/clava-flow/cfg/node/GotoNode";
import IfNode from "@specs-feup/clava-flow/cfg/node/IfNode";
import PragmaNode from "@specs-feup/clava-flow/cfg/node/PragmaNode";
import ReturnNode from "@specs-feup/clava-flow/cfg/node/ReturnNode";
import ScopeNode from "@specs-feup/clava-flow/cfg/node/ScopeNode";
import VariableDeclarationNode from "@specs-feup/clava-flow/cfg/node/VariableDeclarationNode";
import WhileNode from "@specs-feup/clava-flow/cfg/node/WhileNode";
import ClavaControlFlowNode from "@specs-feup/clava-flow/ClavaControlFlowNode";
import ClavaFlowGraph from "@specs-feup/clava-flow/ClavaFlowGraph";
import ClavaFunctionNode from "@specs-feup/clava-flow/ClavaFunctionNode";
import ClavaNode from "@specs-feup/clava-flow/ClavaNode";
import { ExprStmt, Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import FlowDotFormatter from "@specs-feup/flow/flow/dot/FlowDotFormatter";
import BaseEdge from "@specs-feup/flow/graph/BaseEdge";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import DefaultDotFormatter from "@specs-feup/flow/graph/dot/DefaultDotFormatter";
import Edge from "@specs-feup/flow/graph/Edge";
import Node from "@specs-feup/flow/graph/Node";

export default class ClavaFlowDotFormatter<
    G extends ClavaFlowGraph.Class = ClavaFlowGraph.Class,
> extends FlowDotFormatter<G> {
    static jumpScopeTransparency = "8f";
    static codeFontSize = "10";
    static locationFontSize = "9";
    static locationFontColor = "#c0c0c0";
    static keywordColor = "#4040e0";
    static symbolColor = "#8080a0";
    static trueColor = "#7bc706";
    static falseColor = "#d10202";

    static renderLineNumber(
        jp: Joinpoint,
        last: boolean = false,
        includeFilename: boolean = false,
    ): string {
        const line = (last ? jp.endLine : jp.line) ?? "?";
        const column = (last ? jp.endColumn : jp.column) ?? "?";
        const label = includeFilename
            ? `${jp.filename ?? "?"}:${line}:${column}`
            : `${line}:${column}`;
        return `<FONT FACE="Consolas" COLOR="${ClavaFlowDotFormatter.locationFontColor}" POINT-SIZE="${ClavaFlowDotFormatter.locationFontSize}">${label}</FONT>`;
    }

    static renderKeyword(kw: string): string {
        return `<FONT FACE="Consolas" COLOR="${ClavaFlowDotFormatter.keywordColor}" POINT-SIZE="${ClavaFlowDotFormatter.codeFontSize}">${kw}</FONT>`;
    }

    static renderSymbol(sym: string, transparency: string = ""): string {
        return `<FONT FACE="Consolas" COLOR="${ClavaFlowDotFormatter.symbolColor + transparency}" POINT-SIZE="${ClavaFlowDotFormatter.codeFontSize}">${sym}</FONT>`;
    }

    static renderUnknownNode(jp: Joinpoint): string {
        return `<FONT FACE="Arial" COLOR="${ClavaFlowDotFormatter.symbolColor}" POINT-SIZE="6"><SUP>[Unknown joinpoint]</SUP>&nbsp;</FONT>${ClavaFlowDotFormatter.renderValue(jp.code)}`;
    }

    static renderValue(value: string): string {
        return `<FONT FACE="Consolas" POINT-SIZE="${ClavaFlowDotFormatter.codeFontSize}"><I>${value}</I></FONT>`;
    }

    static renderComment(comment: string): string {
        return `<FONT FACE="Consolas" COLOR="${ClavaFlowDotFormatter.locationFontColor}" POINT-SIZE="${ClavaFlowDotFormatter.locationFontSize}"><I>${comment}</I></FONT>`;
    }

    static renderNodeLabel(
        lineRef: Joinpoint | { jp: Joinpoint; last?: boolean; includeFilename?: boolean },
        ...labels: string[]
    ) {
        const jp = lineRef instanceof Joinpoint ? lineRef : lineRef.jp;
        const last = lineRef instanceof Joinpoint ? false : (lineRef.last ?? false);
        const includeFilename =
            lineRef instanceof Joinpoint ? false : (lineRef.includeFilename ?? false);
        return `<${ClavaFlowDotFormatter.renderLineNumber(jp, last, includeFilename)}<BR/>${labels.join("")}>`;
    }

    /**
     * @param node The node to get the attributes for.
     * @returns The attributes of the node.
     */
    static defaultGetNodeAttrs(node: BaseNode.Class): Record<string, string> {
        if (!node.is(ClavaNode)) {
            return {};
        }
        const result: Record<string, string> = {};
        node.switch(
            Node.Case(ClavaFunctionNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    { jp: n.jp, includeFilename: true },
                    n.functionName,
                );
            }),
            Node.Case(CommentNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderSymbol(n.jp.code),
                );
            }),
            Node.Case(PragmaNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderSymbol(n.jp.code),
                );
            }),
            Node.Case(ScopeNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    { jp: n.jp, last: n.isScopeEnd },
                    ClavaFlowDotFormatter.renderSymbol(
                        n.isScopeStart ? "{" : "}",
                        n.isFlowJump ? ClavaFlowDotFormatter.jumpScopeTransparency : "",
                    ),
                );
                if (n.isFlowJump) {
                    result.color =
                        FlowDotFormatter.cfgNodeColor +
                        ClavaFlowDotFormatter.jumpScopeTransparency;
                    result.style = "dashed";
                }
            }),
            Node.Case(VariableDeclarationNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderValue(n.jp.code),
                );
            }),
            Node.Case(ExpressionNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderValue(n.jp.code),
                );
            }),
            Node.Case(EmptyStatementNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderSymbol(";"),
                );
            }),
            Node.Case(BreakNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderKeyword("break"),
                );
            }),
            Node.Case(ContinueNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderKeyword("continue"),
                );
            }),
            Node.Case(GotoNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderKeyword("goto"),
                    " ",
                    ClavaFlowDotFormatter.renderValue(n.jp.label.name),
                );
            }),
            Node.Case(GotoLabelNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderValue(n.jp.name),
                    ClavaFlowDotFormatter.renderSymbol(":"),
                );
            }),
            Node.Case(ReturnNode, (n) => {
                if (n.jp.returnExpr === undefined) {
                    result.label = ClavaFlowDotFormatter.renderNodeLabel(
                        n.jp,
                        ClavaFlowDotFormatter.renderKeyword("return"),
                    );
                } else {
                    result.label = ClavaFlowDotFormatter.renderNodeLabel(
                        n.jp,
                        ClavaFlowDotFormatter.renderKeyword("return"),
                        " ",
                        ClavaFlowDotFormatter.renderValue(n.jp.returnExpr.code),
                    );
                }
            }),
            Node.Case(IfNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderKeyword("if"),
                    " ",
                    ClavaFlowDotFormatter.renderSymbol("("),
                    ClavaFlowDotFormatter.renderValue(n.jp.cond.code),
                    ClavaFlowDotFormatter.renderSymbol(")"),
                );
            }),
            Node.Case(WhileNode, (n) => {
                // TODO confirm that nothing can go wrong in: while, for, for-each, do-while
                // (e.g., statement not being an expression) - and make better sugar to access it
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderKeyword("while"),
                    " ",
                    ClavaFlowDotFormatter.renderSymbol("("),
                    ClavaFlowDotFormatter.renderValue((n.jp.cond as ExprStmt).expr.code),
                    ClavaFlowDotFormatter.renderSymbol(")"),
                );
            }),
            Node.Case(DoWhileNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderKeyword("do-while"),
                    " ",
                    ClavaFlowDotFormatter.renderSymbol("("),
                    ClavaFlowDotFormatter.renderValue((n.jp.cond as ExprStmt).expr.code),
                    ClavaFlowDotFormatter.renderSymbol(")"),
                );
            }),
            Node.Case(ForNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderKeyword("for"),
                    ClavaFlowDotFormatter.renderSymbol("&nbsp;(...;"),
                    ClavaFlowDotFormatter.renderValue((n.jp.cond as ExprStmt).expr.code),
                    ClavaFlowDotFormatter.renderSymbol("; ...)"),
                );
            }),
            Node.Case(ForEachNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderKeyword("for-each"),
                    " ",
                    ClavaFlowDotFormatter.renderSymbol("&nbsp;(...;"),
                    ClavaFlowDotFormatter.renderValue(
                        (n.jp.children[3] as ExprStmt).expr.code,
                    ),
                    ClavaFlowDotFormatter.renderSymbol("; ...)"),
                );
            }),
            Node.Case(ClavaControlFlowNode, (n) => {
                result.label = ClavaFlowDotFormatter.renderNodeLabel(
                    n.jp,
                    ClavaFlowDotFormatter.renderUnknownNode(n.jp),
                );
            }),
        );

        return result;
    }

    /**
     * @param edge The edge to get the attributes for.
     * @returns The attributes of the edge.
     */
    static defaultGetEdgeAttrs(edge: BaseEdge.Class): Record<string, string> {
        const result: Record<string, string> = {};
        edge.switch(
            Edge.Case(ConditionalEdge, (e) => {
                if (e.executesIfTrue) {
                    result.color = ClavaFlowDotFormatter.trueColor;
                } else {
                    result.color = ClavaFlowDotFormatter.falseColor;
                }
                if (e.isFake) {
                    result.color += FlowDotFormatter.cfgEdgeTransparency;
                }
            }),
        );
        return result;
    }

    /**
     * Creates a new clava flow DOT formatter.
     */
    constructor() {
        super();
        this.addNodeAttrs(ClavaFlowDotFormatter.defaultGetNodeAttrs).addEdgeAttrs(
            ClavaFlowDotFormatter.defaultGetEdgeAttrs,
        );
    }
}
