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

        // TODO possibly add optional configuration to explore unselected functions that were called and
        //      have a definition.
        //      This would permit selecting one entry point (example: main), and finding all the
        //      "potentially reachable" functions from that entry point
        // TODO functions that were actually processed should be marked as such (this should facilitate
        //      debug, given that one may have forgot to process one function and think that it has no calls)
        for (const jp of this.#jps) {
            if (jp instanceof Program || jp instanceof FileJp) {
                for (const fn of Query.searchFrom(jp, FunctionJp, fn => fn.isImplementation)) {
                    this.#processFunction(cgraph, fn);
                }
            } else if (jp instanceof FunctionJp) {
                if (!jp.isImplementation) {
                    throw new LaraFlowError(
                        "Cannot build graph for function without implementation",
                    );
                }
                this.#processFunction(cgraph, jp);
            }
        }

        return cgraph;
    }

    #processFunction(graph: ClavaFlowGraph.Class, fn: FunctionJp): void {
        const fnNode = graph.getOrAddFunction(fn);

        const visited = new Set<string>();
        for (const call of Query.searchFrom(fn, Call)) {
            if (call.getAncestor("function").astId !== fn.astId) {
                continue;
            }
            if (visited.has(call.signature)) {
                continue;
            }
            visited.add(call.signature);
            const calleeNode = graph.getOrAddFunction(call.signature);
            graph.addEdge(fnNode, calleeNode).init(new CallEdge.Builder());
        }
    }
}
