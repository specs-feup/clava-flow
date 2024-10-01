import BaseGraph from "clava-flow/graph/BaseGraph";
import BaseNode from "clava-flow/graph/BaseNode";
import cytoscape from "@specs-feup/lara/api/libs/cytoscape-3.26.0.js";

export type NodeConstructor<
    D extends BaseNode.Data,
    S extends BaseNode.ScratchData,
    N extends BaseNode.Class<D, S>,
> = new (graph: BaseGraph.Class, node: cytoscape.NodeSingular, _d: D, _sd: S) => N;

export interface NodeBuilder<D extends BaseNode.Data, S extends BaseNode.ScratchData> {
    buildData(data: BaseNode.Data): D;
    buildScratchData(scratchData: BaseNode.ScratchData): S;
}

export interface NodeTypeGuard<D extends BaseNode.Data, S extends BaseNode.ScratchData> {
    isDataCompatible(data: BaseNode.Data): data is D;
    isScratchDataCompatible(sData: BaseNode.ScratchData): sData is S;
}
