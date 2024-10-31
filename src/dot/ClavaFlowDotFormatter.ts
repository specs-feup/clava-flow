import BreakNode from "@specs-feup/clava-flow/cfg/BreakNode";
import CommentNode from "@specs-feup/clava-flow/cfg/CommentNode";
import ContinueNode from "@specs-feup/clava-flow/cfg/ContinueNode";
import DoWhileNode from "@specs-feup/clava-flow/cfg/DoWhileNode";
import EmptyStatementNode from "@specs-feup/clava-flow/cfg/EmptyStatementNode";
import ExpressionNode from "@specs-feup/clava-flow/cfg/ExpressionNode";
import ForEachNode from "@specs-feup/clava-flow/cfg/ForEachNode";
import ForNode from "@specs-feup/clava-flow/cfg/ForNode";
import GotoLabelNode from "@specs-feup/clava-flow/cfg/GotoLabelNode";
import GotoNode from "@specs-feup/clava-flow/cfg/GotoNode";
import IfNode from "@specs-feup/clava-flow/cfg/IfNode";
import PragmaNode from "@specs-feup/clava-flow/cfg/PragmaNode";
import ReturnNode from "@specs-feup/clava-flow/cfg/ReturnNode";
import ScopeNode from "@specs-feup/clava-flow/cfg/ScopeNode";
import VariableDeclarationNode from "@specs-feup/clava-flow/cfg/VariableDeclarationNode";
import WhileNode from "@specs-feup/clava-flow/cfg/WhileNode";
import ClavaControlFlowNode from "@specs-feup/clava-flow/ClavaControlFlowNode";
import ClavaFlowGraph from "@specs-feup/clava-flow/ClavaFlowGraph";
import ClavaNode from "@specs-feup/clava-flow/ClavaNode";
import { ExprStmt } from "@specs-feup/clava/api/Joinpoints.js";
import FlowDotFormatter from "@specs-feup/lara-flow/flow/dot/FlowDotFormatter";
import BaseEdge from "@specs-feup/lara-flow/graph/BaseEdge";
import BaseNode from "@specs-feup/lara-flow/graph/BaseNode";
import DefaultDotFormatter from "@specs-feup/lara-flow/graph/dot/DefaultDotFormatter";
import Node from "@specs-feup/lara-flow/graph/Node";

export default class ClavaFlowDotFormatter<
    G extends ClavaFlowGraph.Class = ClavaFlowGraph.Class,
> extends FlowDotFormatter<G> {
    static jumpScopeTransparency = "8f";

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
            Node.Case(CommentNode, (n) => {
                result.label = n.jp.code;
            }),
            Node.Case(PragmaNode, (n) => {
                result.label = n.jp.code;
            }),
            Node.Case(ScopeNode, (n) => {
                result.label = n.isScopeStart ? "{" : "}";
                if (n.isFlowJump) {
                    result.fontcolor =
                        FlowDotFormatter.cfgNodeDarkColor +
                        ClavaFlowDotFormatter.jumpScopeTransparency;
                    result.color =
                        FlowDotFormatter.cfgNodeColor +
                        ClavaFlowDotFormatter.jumpScopeTransparency;
                    result.style = "dashed";
                }
            }),
            Node.Case(VariableDeclarationNode, (n) => {
                result.label = n.jp.code;
            }),
            Node.Case(ExpressionNode, (n) => {
                result.label = n.jp.code;
            }),
            Node.Case(EmptyStatementNode, (n) => {
                result.label = ";";
            }),
            Node.Case(BreakNode, (n) => {
                result.label = "break";
            }),
            Node.Case(ContinueNode, (n) => {
                result.label = "continue";
            }),
            Node.Case(GotoNode, (n) => {
                result.label = "goto " + n.jp.label.name;
            }),
            Node.Case(GotoLabelNode, (n) => {
                result.label = n.jp.name + ":";
            }),
            Node.Case(ReturnNode, (n) => {
                result.label = "return";
                const retVal = n.jp.returnExpr;
                if (retVal !== undefined) {
                    result.label += " " + retVal.code;
                }
            }),
            Node.Case(IfNode, (n) => {
                result.label = "if (" + n.jp.cond.code + ")";
            }),
            Node.Case(WhileNode, (n) => {
                // TODO confirm that nothing can go wrong in while or for
                // (e.g., statement not being an expression)
                result.label = "while (" + (n.jp.cond as ExprStmt).expr.code + ")";
            }),
            Node.Case(DoWhileNode, (n) => {
                // TODO confirm that nothing can go wrong in while or for
                // (e.g., statement not being an expression)
                result.label = "do-while (" + (n.jp.cond as ExprStmt).expr.code + ")";
            }),
            Node.Case(ForNode, (n) => {
                // TODO confirm that nothing can go wrong in while or for
                // (e.g., statement not being an expression)
                result.label = "for (...; " + (n.jp.cond as ExprStmt).expr.code + "; ...)";
            }),
            Node.Case(ForEachNode, (n) => {
                // TODO confirm that nothing can go wrong in while or for
                // (e.g., statement not being an expression)
                // TODO fix the whole for-each thing
                result.label = "for-each (" + (n.jp.children[3] as ExprStmt).expr.code + ")";
            }),
            Node.Case(ClavaControlFlowNode, (n) => {
                result.label = "Unknown node |" + n.jp.code;
            }),
        );
        return result;
    }

    /**
     * @param edge The edge to get the attributes for.
     * @returns The attributes of the edge.
     */
    static defaultGetEdgeAttrs(edge: BaseEdge.Class): Record<string, string> {
        return {};
        //     const result: Record<string, string> = {};
        //     edge.switch(
        //         Edge.Case(CallEdge, (e) => {
        //             result.color = FlowDotFormatter.functionColor;
        //         }),
        //         Edge.Case(ControlFlowEdge, (e) => {
        //             result.color = FlowDotFormatter.cfgDefaultEdgeColor;
        //             if (e.isFake) {
        //                 result.color += FlowDotFormatter.cfgEdgeTransparency;
        //             }
        //         }),
        //     );
        //     return result;
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
