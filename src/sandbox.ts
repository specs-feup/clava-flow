import ClavaFunctionNode from "@specs-feup/clava-flow/ClavaFunctionNode";
import ClavaFlowDotFormatter from "@specs-feup/clava-flow/dot/ClavaFlowDotFormatter";
import ClavaCfgGenerator from "@specs-feup/clava-flow/transformation/ClavaCfgGenerator";
import ClavaScgGenerator from "@specs-feup/clava-flow/transformation/ClavaScgGenerator";
import { Program } from "@specs-feup/clava/api/Joinpoints.js";
import Graph from "@specs-feup/flow/graph/Graph";
import Query from "@specs-feup/lara/api/weaver/Query.js";

const graph = Graph.create()
    .apply(new ClavaCfgGenerator(Query.root() as Program))
    .apply(new ClavaScgGenerator(Query.root() as Program));

const formatter = new ClavaFlowDotFormatter();
graph.toFile(formatter, "out/graph.dot");
