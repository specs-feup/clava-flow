import ClavaFlowGraph from "@specs-feup/clava-flow/ClavaFlowGraph";
import { Call, FileJp, FunctionJp, Program } from "@specs-feup/clava/api/Joinpoints.js";
import LaraFlowError from "@specs-feup/flow/error/LaraFlowError";
import CallEdge from "@specs-feup/flow/flow/CallEdge";
import FlowGraph from "@specs-feup/flow/flow/FlowGraph";
import BaseGraph from "@specs-feup/flow/graph/BaseGraph";
import Graph from "@specs-feup/flow/graph/Graph";
import Query from "@specs-feup/lara/api/weaver/Query.js";

export default class ClavaScgGenerator
    implements Graph.Transformation<BaseGraph.Class, ClavaFlowGraph.Class>
{
    #jps: (Program | FileJp | FunctionJp)[];

    constructor(...jps: (Program | FileJp | FunctionJp)[]) {
        this.#jps = jps;
    }

    apply(graph: BaseGraph.Class): ClavaFlowGraph.Class {
        // Initializes graph type only if necessary
        let cgraph: ClavaFlowGraph.Class;
        if (graph.is(ClavaFlowGraph)) {
            cgraph = graph.as(ClavaFlowGraph);
        } else {
            let fgraph: FlowGraph.Class;
            if (graph.is(FlowGraph)) {
                fgraph = graph.as(FlowGraph);
            } else {
                fgraph = graph.init(new FlowGraph.Builder()).as(FlowGraph);
            }
            cgraph = fgraph.init(new ClavaFlowGraph.Builder()).as(ClavaFlowGraph);
        }

        // Process all function implementations inside Programs and FileJps
        // Only process a FunctionJp if it is an implementation (and ignore nested functions)
        const functionsToProcess = new Set<FunctionJp>();
        for (const jp of this.#jps) {
            if (jp instanceof Program || jp instanceof FileJp) {
                for (const fn of Query.searchFrom(jp, FunctionJp, {
                    isImplementation: true,
                })) {
                    functionsToProcess.add(fn);
                }
            } else if (jp instanceof FunctionJp) {
                if (!jp.isImplementation) {
                    throw new LaraFlowError(
                        "Cannot build graph for function without implementation",
                    );
                }
                functionsToProcess.add(jp);
            }
        }

        for (const fn of functionsToProcess) {
            this.#processFunction(cgraph, fn);
        }

        return cgraph;
    }

    #processFunction(graph: ClavaFlowGraph.Class, fn: FunctionJp): void {
        const fnNode = graph.getOrAddFunction(fn);
        // TODO only accept direct calls, not calls from nested functions
        for (const call of Query.searchFrom(fn, Call)) {
            const callee = call.definition ?? call.declaration; // TODO may be undefined
            const calleeNode = graph.getOrAddFunction(callee);
            // TODO repeat or only once?
            const callEdge = graph.addEdge(fnNode, calleeNode).init(new CallEdge.Builder());
        }
    }
}
