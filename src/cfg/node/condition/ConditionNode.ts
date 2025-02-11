import ClavaControlFlowNode from "@specs-feup/clava-flow/ClavaControlFlowNode";
import ClavaNode from "@specs-feup/clava-flow/ClavaNode";
import { Expression, ExprStmt, If, Loop, Switch } from "@specs-feup/clava/api/Joinpoints.js";
import ControlFlowNode from "@specs-feup/flow/flow/ControlFlowNode";
import Node from "@specs-feup/flow/graph/Node";

namespace ConditionNode {
    export const TAG = "__clava_flow__condition_node";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends ClavaControlFlowNode.Class<D, S> {
        override get jp(): Loop | If | Switch {
            return this.scratchData[ClavaNode.TAG].jp;
        }

        get condition(): Expression {
            if (this.jp instanceof If) {
                return this.jp.cond;
            }
            if (this.jp instanceof Switch) {
                return this.jp.condition;
            }
            return (this.jp.cond as ExprStmt).expr;
        }
    }

    export class Builder
        implements
            Node.Builder<
                Data,
                ScratchData,
                ControlFlowNode.Data,
                ControlFlowNode.ScratchData
            >
    {
        #jp: Loop | If | Switch;
        #clavaNodeBuilder: ClavaNode.Builder;

        constructor(jp: Loop | If | Switch) {
            this.#jp = jp;
            this.#clavaNodeBuilder = new ClavaNode.Builder(this.#jp);
        }

        buildData(data: ControlFlowNode.Data): Data {
            return {
                ...data,
                ...this.#clavaNodeBuilder.buildData(data),
                [TAG]: {
                    version: VERSION,
                },
            };
        }

        buildScratchData(scratchData: ControlFlowNode.ScratchData): ScratchData {
            return {
                ...scratchData,
                ...this.#clavaNodeBuilder.buildScratchData(scratchData),
                [ClavaNode.TAG]: {
                    jp: this.#jp,
                },
            };
        }
    }

    export const TypeGuard = Node.TagTypeGuard<Data, ScratchData>(
        TAG,
        VERSION,
        (sData) => {
            return (
                ClavaControlFlowNode.TypeGuard.isScratchDataCompatible(sData) &&
                (sData[ClavaNode.TAG].jp instanceof Loop || sData[ClavaNode.TAG].jp instanceof If)
            );
        },
    );

    export interface Data extends ClavaControlFlowNode.Data {
        [TAG]: {
            version: typeof VERSION;
        };
    }

    export interface ScratchData extends ClavaControlFlowNode.ScratchData {
        [ClavaNode.TAG]: {
            jp: Loop | If | Switch;
        };
    }
}

export default ConditionNode;
