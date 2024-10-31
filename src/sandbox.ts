import ClavaFlowDotFormatter from "@specs-feup/clava-flow/dot/ClavaFlowDotFormatter";
import ClavaCfgGenerator from "@specs-feup/clava-flow/transformation/ClavaCfgGenerator";
import { Program } from "@specs-feup/clava/api/Joinpoints.js";
import Graph from "@specs-feup/lara-flow/graph/Graph";
import Query from "@specs-feup/lara/api/weaver/Query.js";

const graph = Graph.create().apply(new ClavaCfgGenerator(Query.root() as Program));
const formatter = new ClavaFlowDotFormatter();
graph.toFile(formatter, "out/graph.dot");
                 