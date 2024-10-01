// Without this import, clava does not work for some reason
import "@specs-feup/clava/api/Joinpoints.js";
import { Program } from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import FlowGraph from "clava-flow/flow/FlowGraph";
import DefaultFlowGraphDotFormatter from "clava-flow/dot/DefaultFlowGraphDotFormatter";
import Graph, { GraphTransformation } from "clava-flow/graph/Graph";
import FlowNode from "clava-flow/flow/node/FlowNode";
import BaseGraph from "clava-flow/graph/BaseGraph";
import FilterFlowNodes from "clava-flow/flow/transformation/FilterFlowNodes";
import EmptyStatementNode from "clava-flow/flow/node/instruction/EmptyStatementNode";
import SwitchNode from "clava-flow/flow/node/instruction/SwitchNode";
import BreakNode from "clava-flow/flow/node/instruction/BreakNode";
import ContinueNode from "clava-flow/flow/node/instruction/ContinueNode";
import GotoLabelNode from "clava-flow/flow/node/instruction/GotoLabelNode";
import GotoNode from "clava-flow/flow/node/instruction/GotoNode";
import CommentNode from "clava-flow/flow/node/instruction/CommentNode";

const graph = FlowGraph
    .generate(Query.root() as Program)
    // .apply(new )
    // .apply(new FilterFlowNodes(node => (
    //     !node.is(EmptyStatementNode.TypeGuard)
    //     && !node.is(SwitchNode.TypeGuard)
    //     && !node.is(BreakNode.TypeGuard)
    //     && !node.is(ContinueNode.TypeGuard)
    //     && !node.is(GotoLabelNode.TypeGuard)
    //     && !node.is(GotoNode.TypeGuard)
    //     && !node.is(CommentNode.TypeGuard)
    // )))
graph.toDotFile(new DefaultFlowGraphDotFormatter, "out/woven_code/sandbox/graph.dot");

// TODO remove dead code
//      split expressions
//      remove empty_statements, switch, break, continue, goto_label, goto, comment

