import ClavaFunctionNode from "@specs-feup/clava-flow/ClavaFunctionNode";
import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import FlowGraph from "@specs-feup/lara-flow/flow/FlowGraph";
import FunctionNode from "@specs-feup/lara-flow/flow/FunctionNode";
import BaseNode from "@specs-feup/lara-flow/graph/BaseNode";
import Graph from "@specs-feup/lara-flow/graph/Graph";
import { NodeCollection } from "@specs-feup/lara-flow/graph/NodeCollection";

namespace ClavaFlowGraph {
    export const TAG = "__clava_flow__clava_flow_graph";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends FlowGraph.Class<D, S> {
        addFunction(name: string, node?: BaseNode.Class): FunctionNode.Class;
        addFunction(fn: FunctionJp, node?: BaseNode.Class): ClavaFunctionNode.Class;
        override addFunction(
            fn: FunctionJp | string,
            node?: BaseNode.Class,
        ): FunctionNode.Class {
            if (typeof fn === "string") {
                return super.addFunction(fn, node);
            }

            return super
                .addFunction(fn.signature, node)
                .init(new ClavaFunctionNode.Builder(fn))
                .as(ClavaFunctionNode);
        }

        getFunction(name: string): FunctionNode.Class | undefined;
        getFunction(fn: FunctionJp | string): ClavaFunctionNode.Class | undefined;
        override getFunction(fn: string | FunctionJp): FunctionNode.Class | undefined {
            if (typeof fn === "string") {
                return super.getFunction(fn);
            }

            // TODO using signature might not be sufficient for C++ functions
            //       (depending, for example, how methods are handled)
            //       If that's the case, use more sophisticated mangling
            return super.getFunction(fn.signature)?.tryAs(ClavaFunctionNode);
        }

        hasFunction(name: string): boolean;
        hasFunction(fn: FunctionJp): boolean;
        override hasFunction(fn: string | FunctionJp): boolean {
            return this.getFunction(fn) !== undefined;
        }

        get clavaFunctions(): NodeCollection<
            ClavaFunctionNode.Data,
            ClavaFunctionNode.ScratchData,
            ClavaFunctionNode.Class
        > {
            return this.functions.filterIs(ClavaFunctionNode);
        }

        // TODO register jps
        // /**
        //  * Returns the graph node where the given statement belongs.
        //  *
        //  * @param $stmt - A statement join point, or a string with the astId of the join point
        //  */
        // getNode($stmt: Statement | string) {
        //     // If string, assume it is astId
        //     const astId: string = typeof $stmt === "string" ? $stmt : $stmt.astId;

        //     return this.#nodes.get(astId);
        // }
    }

    export class Builder
        implements
            Graph.Builder<Data, ScratchData, FlowGraph.Data, FlowGraph.ScratchData>
    {
        buildData(data: FlowGraph.Data): Data {
            return {
                ...data,
                [TAG]: {
                    version: VERSION,
                },
            };
        }

        buildScratchData(scratchData: FlowGraph.ScratchData): ScratchData {
            return {
                ...scratchData,
                [TAG]: {
                    jpToNodeMap: {},
                },
            };
        }
    }

    export const TypeGuard = Graph.TagTypeGuard<Data, ScratchData>(
        TAG,
        VERSION,
        (sData) => {
            const sd = sData as ScratchData;
            return typeof sd[TAG] === "object" && typeof sd[TAG].jpToNodeMap === "object";
        },
    );

    export interface Data extends FlowGraph.Data {
        [TAG]: {
            version: typeof VERSION;
        };
    }

    export interface ScratchData extends FlowGraph.ScratchData {
        [TAG]: {
            jpToNodeMap: Record<string, string[]>;
        };
    }
}

export default ClavaFlowGraph;
