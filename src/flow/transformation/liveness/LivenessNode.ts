import ControlFlowEdge from "clava-flow/flow/edge/ControlFlowEdge";
import FlowNode from "clava-flow/flow/node/FlowNode";
import InstructionNode from "clava-flow/flow/node/instruction/InstructionNode";
import BaseNode from "clava-flow/graph/BaseNode";
import { NodeBuilder, NodeTypeGuard } from "clava-flow/graph/Node";
import { Joinpoint, Vardecl } from "@specs-feup/clava/api/Joinpoints.js";

namespace LivenessNode {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends FlowNode.Class<D, S> {
        get defs(): Vardecl[] {
            return Array.from(this.scratchData.liveness.defs.values());
        }

        addDef(def: Vardecl): void {
            this.scratchData.liveness.defs.set(def.astId, def);
        }

        get uses(): Vardecl[] {
            return Array.from(this.scratchData.liveness.uses.values());
        }

        addUse(use: Vardecl): void {
            this.scratchData.liveness.uses.set(use.astId, use);
        }

        get liveIn(): Vardecl[] {
            return Array.from(this.scratchData.liveness.liveIn.values());
        }

        updateLiveIn(): void {
            this.scratchData.liveness.liveIn = new Map();
            const liveIn = this.scratchData.liveness.liveIn;
            const liveOut = this.scratchData.liveness.liveOut;
            const defs = this.scratchData.liveness.defs;
            const uses = this.scratchData.liveness.uses;
            
            for (const [id, variable] of liveOut.entries()) {
                if (!defs.has(id)) {
                    liveIn.set(id, variable);
                }
            }

            for (const [id, variable] of uses.entries()) {
                liveIn.set(id, variable);
            }
        }

        get liveOut(): Vardecl[] {
            return Array.from(this.scratchData.liveness.liveOut.values());
        }

        updateLiveOut(): void {
            this.scratchData.liveness.liveOut = new Map();
            const liveOut = this.scratchData.liveness.liveOut;
            
            const children = this.outgoers
                .filter((edge) => edge.is(ControlFlowEdge.TypeGuard))
                .map((edge) => edge.target);
            
            for (const child of children) {
                if (!child.is(LivenessNode.TypeGuard)) {
                    continue;
                }

                const childLiveIn = child
                    .as(LivenessNode.Class)
                    .scratchData
                    .liveness
                    .liveIn;
                for (const [id, variable] of childLiveIn.entries()) {
                    liveOut.set(id, variable);
                }
            }
        }
    }

    export class Builder
        extends BaseNode.Builder
        implements NodeBuilder<Data, ScratchData>
    {
        override buildData(data: BaseNode.Data): Data {
            if (!FlowNode.TypeGuard.isDataCompatible(data)) {
                throw new Error("Liveness Node can only be built from a FlowNode.");
            }

            return {
                ...data,
                ...super.buildData(data),
            };
        }

        override buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            if (!FlowNode.TypeGuard.isScratchDataCompatible(scratchData)) {
                throw new Error("Liveness Node can only be built from a FlowNode.");
            }
            
            return {
                ...scratchData,
                ...super.buildScratchData(scratchData),
                liveness: {
                    defs: new Map(),
                    uses: new Map(),
                    liveIn: new Map(),
                    liveOut: new Map(),
                },
            };
        }
    }

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            if (!FlowNode.TypeGuard.isDataCompatible(data)) return false;
            return true;
        },

        isScratchDataCompatible(
            scratchData: BaseNode.ScratchData,
        ): scratchData is ScratchData {
            if (!FlowNode.TypeGuard.isScratchDataCompatible(scratchData)) return false;
            const s = scratchData as ScratchData;
            if (s.liveness === undefined) return false;
            if (!(s.liveness.defs instanceof Map)) return false;
            if (!(s.liveness.uses instanceof Map)) return false;
            if (!(s.liveness.liveIn instanceof Map)) return false;
            if (!(s.liveness.liveOut instanceof Map)) return false;
            return true;
        },
    };

    export interface Data extends BaseNode.Data, FlowNode.Data {}

    export interface ScratchData extends BaseNode.ScratchData, FlowNode.ScratchData {
        liveness: {
            defs: Map<string, Vardecl>;
            uses: Map<string, Vardecl>;
            liveIn: Map<string, Vardecl>;
            liveOut: Map<string, Vardecl>;
        };
    }
}

export default LivenessNode;
