import cytoscape from "@specs-feup/lara/api/libs/cytoscape-3.26.0.js";
import Graph from "clava-flow/graph/Graph";
import { NodeBuilder, NodeConstructor, NodeTypeGuard } from "clava-flow/graph/Node";
import BaseGraph from "clava-flow/graph/BaseGraph";
import BaseEdge from "clava-flow/graph/BaseEdge";

namespace BaseNode {
    export class Class<D extends Data = Data, S extends ScratchData = ScratchData> {
        #graph: BaseGraph.Class;
        #node: cytoscape.NodeSingular;

        // _d and _sd are a hack to force typescript to typecheck
        // D and S in .as() method.
        constructor(graph: BaseGraph.Class, node: cytoscape.NodeSingular, _d: D = {} as any, _sd: S = {} as any) {
            this.#graph = graph;
            this.#node = node;
        }

        get data(): D {
            return this.#node.data();
        }

        get scratchData(): S {
            return this.#node.scratch(Graph.scratchNamespace);
        }

        get id(): string {
            return this.#node.id();
        }

        get incomers(): BaseEdge.Class[] {
            return this.#node.incomers().edges().map((edge) => new BaseEdge.Class(this.#graph, edge));
        }

        get outgoers(): BaseEdge.Class[] {
            return this.#node.outgoers().edges().map((edge) => new BaseEdge.Class(this.#graph, edge));
        }

        is<D2 extends Data, S2 extends ScratchData>(
            guard: NodeTypeGuard<D2, S2>,
        ): this is BaseNode.Class<D2, S2> {
            const data = this.data;
            const scratchData = this.scratchData;
            const result =
                guard.isDataCompatible(data) &&
                guard.isScratchDataCompatible(scratchData);

            // Have typescript statically check that the types are correct
            // in the implementation of this function.
            result && (data satisfies D2) && (scratchData satisfies S2);

            return result;
        }

        as<N extends BaseNode.Class<D, S>>(
            NodeType: NodeConstructor<D, S, N>
        ): N {
            return new NodeType(this.#graph, this.#node, this.data, this.scratchData);
        }

        init<D2 extends BaseNode.Data, S2 extends BaseNode.ScratchData>(builder: NodeBuilder<D2, S2>): BaseNode.Class<D2, S2> {
            const initedData = builder.buildData(this.data);
            const initedScratchData = builder.buildScratchData(this.scratchData);
            this.#node.data(initedData);
            this.#node.scratch(Graph.scratchNamespace, initedScratchData);
            return new BaseNode.Class(this.#graph, this.#node, initedData, initedScratchData);
        }

        remove() {
            this.#node.remove();
        }

        // cytoscape's dfs is not flexible enough for clava-flow purposes
        // at least as far as I can tell
        // Returns a generator that yields [node, path, index]
        bfs(propagate: (edge: BaseEdge.Class) => boolean): Generator<[BaseNode.Class, BaseEdge.Class[], number]> {
            function* inner(
                root: BaseNode.Class,
            ): Generator<[BaseNode.Class, BaseEdge.Class[], number]> {
                const toVisit: [BaseNode.Class, BaseEdge.Class[]][] = [[root, []]];
                const visited = new Set();
                let idx = 0;

                while (toVisit.length > 0) {
                    const [node, path] = toVisit.pop()!;
                    if (visited.has(node.id)) {
                        continue;
                    }
                    if (path.length > 0 && !propagate(path[path.length - 1])) {
                        continue;
                    }

                    yield [node, path, idx];
                    idx++;
                    visited.add(node.id);

                    for (const out of node.outgoers) {
                        toVisit.push([out.target, [...path, out]]);
                    }
                }
            }

            return inner(this);
        }

        get graph(): BaseGraph.Class {
            return this.#graph;
        }

        toCy(): cytoscape.NodeSingular {
            return this.#node;
        }
    }

    export class Builder implements NodeBuilder<Data, ScratchData> {
        buildData(data: BaseNode.Data): Data {
            return data;
        }

        buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            return scratchData;
        }
    }

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            return true;
        },

        isScratchDataCompatible(sData: BaseNode.ScratchData): sData is ScratchData {
            return true;
        },
    };

    export interface Data {
        id: string;
    }

    export interface ScratchData { }
}

export default BaseNode;
