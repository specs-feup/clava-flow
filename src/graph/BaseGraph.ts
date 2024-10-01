import cytoscape from "@specs-feup/lara/api/libs/cytoscape-3.26.0.js";
import Graph, { GraphBuilder, GraphConstructor, GraphTransformation, GraphTypeGuard } from "clava-flow/graph/Graph";
import BaseNode from "clava-flow/graph/BaseNode";
import BaseEdge from "clava-flow/graph/BaseEdge";
import { JavaClasses } from "@specs-feup/lara/api/lara/util/JavaTypes.js";
import DotFormatter from "clava-flow/dot/DotFormatter";
import Io from "@specs-feup/lara/api/lara/Io.js";
import EdgeIdGenerator from "clava-flow/graph/id/EdgeIdGenerator";
import NodeIdGenerator from "clava-flow/graph/id/NodeIdGenerator";

namespace BaseGraph {
    export class Class<D extends Data = Data, S extends ScratchData = ScratchData> {
        #graph: cytoscape.Core;

        // _d and _sd are a hack to force typescript to typecheck
        // D and S in .as() method.
        constructor(graph: cytoscape.Core, _d: D = {} as any, _sd: S = {} as any) {
            this.#graph = graph;
        }

        get data(): D {
            return this.#graph.data();
        }

        get scratchData(): S {
            return this.#graph.scratch(Graph.scratchNamespace);
        }

        setNodeIdGenerator(generator: NodeIdGenerator | undefined): this {
            this.#graph.scratch(Graph.scratchNamespace, {
                ...this.scratchData,
                nodeIdGenerator: generator,
            });
            return this;
        }

        setEdgeIdGenerator(generator: EdgeIdGenerator | undefined): this {
            this.#graph.scratch(Graph.scratchNamespace, {
                ...this.scratchData,
                edgeIdGenerator: generator,
            });
            return this;
        }

        addNode(id?: string): BaseNode.Class {
            if (this.scratchData.nodeIdGenerator !== undefined) {
                id = this.scratchData.nodeIdGenerator.newId(this);
            }
            const newNode = this.#graph.add({
                group: "nodes",
                data: { id },
            });
            return new BaseNode.Class(this, newNode);
        }

        addEdge(
            source: BaseNode.Class,
            target: BaseNode.Class,
            id?: string,
        ): BaseEdge.Class {
            if (this.scratchData.edgeIdGenerator !== undefined) {
                id = this.scratchData.edgeIdGenerator.newId(this, source, target);
            }
            const newEdge = this.#graph.add({
                group: "edges",
                data: { id, source: source.id, target: target.id },
            });
            return new BaseEdge.Class(this, newEdge);
        }

        getNodeById(id: string): BaseNode.Class | undefined {
            const node = this.#graph.getElementById(id);
            if (node.isNode()) {
                return new BaseNode.Class(this, node);
            }

            return undefined;
        }

        getEdgeById(id: string): BaseEdge.Class | undefined {
            const edge = this.#graph.getElementById(id);
            if (edge.isEdge()) {
                return new BaseEdge.Class(this, edge);
            }

            return undefined;
        }

        // TODO
        get nodes(): BaseNode.Class[] {
            return this.#graph.nodes().map((node) => new BaseNode.Class(this, node));
        }

        // TODO
        get edges(): BaseEdge.Class[] {
            return this.#graph.edges().map((edge) => new BaseEdge.Class(this, edge));
        }

        is<D2 extends Data, S2 extends ScratchData>(
            guard: GraphTypeGuard<D2, S2>,
        ): this is BaseGraph.Class<D2, S2> {
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

        as<G extends BaseGraph.Class<D, S>>(GraphType: GraphConstructor<D, S, G>): G {
            return new GraphType(this.#graph, this.data, this.scratchData);
        }

        init<D2 extends BaseGraph.Data, S2 extends BaseGraph.ScratchData>(
            builder: GraphBuilder<D2, S2>,
        ): BaseGraph.Class<D2, S2> {
            const initedData = builder.buildData(this.data);
            const initedScratchData = builder.buildScratchData(this.scratchData);
            this.#graph.data(initedData);
            this.#graph.scratch(Graph.scratchNamespace, initedScratchData);
            return new BaseGraph.Class(this.#graph, initedData, initedScratchData);
        }

        apply(transformation: GraphTransformation): this {
            transformation.apply(this);
            return this;
        }

        toDot(dotFormatter: DotFormatter, label?: string): string {
            return dotFormatter.format(this, label);
        }

        toDotFile(
            dotFormatter: DotFormatter,
            filename: string,
            label?: string,
        ): JavaClasses.File {
            return Io.writeFile(filename, this.toDot(dotFormatter, label));
        }

        toCy(): cytoscape.Core {
            return this.#graph;
        }
    }

    export class Builder implements GraphBuilder<Data, ScratchData> {
        buildData(data: BaseGraph.Data): Data {
            return data;
        }

        buildScratchData(scratchData: BaseGraph.ScratchData): ScratchData {
            return scratchData;
        }
    }

    export const TypeGuard: GraphTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseGraph.Data): data is Data {
            return true;
        },

        isScratchDataCompatible(sData: BaseGraph.ScratchData): sData is ScratchData {
            // TODO if possible check that the newId signature is valid
            if (sData.nodeIdGenerator !== undefined && typeof sData.nodeIdGenerator.newId !== "function") {
                return false;
            }
            if (sData.edgeIdGenerator !== undefined && typeof sData.edgeIdGenerator.newId !== "function") {
                return false;
            }
            return true;
        },
    };

    export interface Data {}

    export interface ScratchData {
        nodeIdGenerator: NodeIdGenerator | undefined;
        edgeIdGenerator: EdgeIdGenerator | undefined;
    }
}

export default BaseGraph;
