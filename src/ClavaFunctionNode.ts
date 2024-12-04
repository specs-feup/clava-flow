import ClavaNode from "@specs-feup/clava-flow/ClavaNode";
import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";
import FunctionNode from "@specs-feup/flow/flow/FunctionNode";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import Node from "@specs-feup/flow/graph/Node";

namespace ClavaFunctionNode {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends FunctionNode.Class<D, S> {
        get jp(): FunctionJp {
            return this.scratchData[ClavaNode.TAG].jp;
        }
    }

    export class Builder
        implements
            Node.Builder<Data, ScratchData, FunctionNode.Data, FunctionNode.ScratchData>
    {
        #jp: FunctionJp;
        #clavaNodeBuilder: ClavaNode.Builder;

        constructor(jp: FunctionJp) {
            this.#jp = jp;
            this.#clavaNodeBuilder = new ClavaNode.Builder(this.#jp);
        }

        buildData(data: FunctionNode.Data): Data {
            return {
                ...data,
                ...this.#clavaNodeBuilder.buildData(data),
            };
        }

        buildScratchData(scratchData: FunctionNode.ScratchData): ScratchData {
            return {
                ...scratchData,
                ...this.#clavaNodeBuilder.buildScratchData(scratchData),
                [ClavaNode.TAG]: {
                    jp: this.#jp,
                },
            };
        }
    }

    export const TypeGuard: Node.TypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            return (
                ClavaNode.TypeGuard.isDataCompatible(data) &&
                FunctionNode.TypeGuard.isDataCompatible(data)
            );
        },

        isScratchDataCompatible(sData: BaseNode.ScratchData): sData is ScratchData {
            return (
                ClavaNode.TypeGuard.isScratchDataCompatible(sData) &&
                FunctionNode.TypeGuard.isScratchDataCompatible(sData) &&
                sData[ClavaNode.TAG].jp instanceof FunctionJp
            );
        },
    };

    export interface Data extends FunctionNode.Data, ClavaNode.Data {}

    export interface ScratchData extends FunctionNode.ScratchData, ClavaNode.ScratchData {
        [ClavaNode.TAG]: {
            jp: FunctionJp;
        };
    }
}

export default ClavaFunctionNode;
