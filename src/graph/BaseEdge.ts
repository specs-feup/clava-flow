import BaseGraph from "clava-flow/graph/BaseGraph";
import BaseNode from "clava-flow/graph/BaseNode";
import { EdgeBuilder, EdgeConstructor, EdgeTypeGuard } from "clava-flow/graph/Edge";
import Graph from "clava-flow/graph/Graph";
import cytoscape from "@specs-feup/lara/api/libs/cytoscape-3.26.0.js";

namespace BaseEdge {
    export class Class<D extends Data = Data, S extends ScratchData = ScratchData> {
        #graph: BaseGraph.Class;
        #edge: cytoscape.EdgeSingular;

        // _d and _sd are a hack to force typescript to typecheck
        // D and S in .as() method.
        constructor(
            graph: BaseGraph.Class,
            edge: cytoscape.EdgeSingular,
            _d: D = {} as any,
            _sd: S = {} as any,
        ) {
            this.#graph = graph;
            this.#edge = edge;
        }

        get data(): D {
            return this.#edge.data();
        }

        get scratchData(): S {
            return this.#edge.scratch(Graph.scratchNamespace);
        }

        get id(): string {
            return this.#edge.id();
        }

        get source(): BaseNode.Class {
            return new BaseNode.Class(this.#graph, this.#edge.source());
        }

        set source(node: BaseNode.Class) {
            this.#edge.move({ source: node.id });
        }

        get target(): BaseNode.Class {
            return new BaseNode.Class(this.#graph, this.#edge.target());
        }

        set target(node: BaseNode.Class) {
            this.#edge.move({ target: node.id });
        }

        is<D2 extends Data, S2 extends ScratchData>(
            guard: EdgeTypeGuard<D2, S2>,
        ): this is BaseEdge.Class<D2, S2> {
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

        as<E extends BaseEdge.Class<D, S>>(EdgeType: EdgeConstructor<D, S, E>): E {
            return new EdgeType(this.#graph, this.#edge, this.data, this.scratchData);
        }

        init<D2 extends BaseEdge.Data, S2 extends BaseEdge.ScratchData>(
            builder: EdgeBuilder<D2, S2>,
        ): BaseEdge.Class<D2, S2> {
            const initedData = builder.buildData(this.data);
            const initedScratchData = builder.buildScratchData(this.scratchData);
            this.#edge.data(initedData);
            this.#edge.scratch(Graph.scratchNamespace, initedScratchData);
            return new BaseEdge.Class(
                this.#graph,
                this.#edge,
                initedData,
                initedScratchData,
            );
        }

        remove() {
            this.#edge.remove();
        }

        get graph(): BaseGraph.Class {
            return this.#graph;
        }

        toCy(): cytoscape.EdgeSingular {
            return this.#edge;
        }
    }

    export class Builder implements EdgeBuilder<Data, ScratchData> {
        buildData(data: BaseEdge.Data): Data {
            return data;
        }

        buildScratchData(scratchData: BaseEdge.ScratchData): ScratchData {
            return scratchData;
        }
    }

    export const TypeGuard: EdgeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseEdge.Data): data is Data {
            return true;
        },

        isScratchDataCompatible(scratchData: BaseEdge.ScratchData): scratchData is ScratchData {
            return true;
        },
    };

    export interface Data {
        id: string;
        source: string;
        target: string;
    }

    export interface ScratchData {}
}

export default BaseEdge;
