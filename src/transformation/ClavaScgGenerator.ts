import ClavaFlowGraph from "@specs-feup/clava-flow/ClavaFlowGraph";
import { FileJp, FunctionJp, Program } from "@specs-feup/clava/api/Joinpoints.js";
import LaraFlowError from "@specs-feup/flow/error/LaraFlowError";
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
            // Reuse existing function node if it already exists
            let fnNode = cgraph.getFunction(fn);
            if (fnNode === undefined) {
                fnNode = cgraph.addFunction(fn);
            }
        }

        for (const fn of functionsToProcess) {
            this.#processFunction(cgraph, fn);
        }

        return cgraph;
    }

    #processFunction(graph: ClavaFlowGraph.Class, fn: FunctionJp): void {
        // const ctx = new GeneratorContext(graph, fnNode);
        // const body = this.#processScope(fn.body, ctx);
        // fnNode.cfgEntryNode = body.head!;
        // const endNode = graph
        //     .addNode()
        //     .init(new ControlFlowEndNode.Builder(fnNode))
        //     .as(ControlFlowEndNode);
        // for (const returnTail of ctx.returns) {
        //     ctx.connectOutwardsJump(returnTail, endNode);
        // }
        // ctx.addCfgEdge(body.normalTail[0], endNode);
    }
}
