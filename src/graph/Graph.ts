import cytoscape from "@specs-feup/lara/api/libs/cytoscape-3.26.0.js";
import BaseGraph from "clava-flow/graph/BaseGraph";


export type GraphConstructor<
    D extends BaseGraph.Data,
    S extends BaseGraph.ScratchData,
    G extends BaseGraph.Class<D, S>,
> = new (node: cytoscape.Core, _d: D, _sd: S) => G;

export interface GraphBuilder<D extends BaseGraph.Data, S extends BaseGraph.ScratchData> {
    buildData(data: BaseGraph.Data): D;
    buildScratchData(scratchData: BaseGraph.ScratchData): S;
}

export interface GraphTypeGuard<
    D extends BaseGraph.Data,
    S extends BaseGraph.ScratchData,
> {
    isDataCompatible(data: BaseGraph.Data): data is D;
    isScratchDataCompatible(sData: BaseGraph.ScratchData): sData is S;
}

export interface GraphTransformation {
    apply(graph: BaseGraph.Class): void;
}

namespace Graph {
    export const scratchNamespace = "_clava_flow";

    export function create(): BaseGraph.Class {
        return new BaseGraph.Class(cytoscape({}));
    }

    export function fromCy(graph: cytoscape.Core): BaseGraph.Class {
        return new BaseGraph.Class(graph);
    }
}

export default Graph;
