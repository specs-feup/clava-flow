import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import Node from "@specs-feup/flow/graph/Node";

namespace ClavaNode {
    export const TAG = "__clava_flow__clava_node";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends BaseNode.Class<D, S> {
        get jp(): Joinpoint {
            return this.scratchData[TAG].jp;
        }
    }

    export class Builder implements Node.Builder<Data, ScratchData> {
        #jp: Joinpoint;

        constructor(jp: Joinpoint) {
            this.#jp = jp;
        }

        buildData(data: BaseNode.Data): Data {
            return {
                ...data,
                [TAG]: {
                    version: VERSION,
                },
            };
        }

        buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            return {
                ...scratchData,
                [TAG]: {
                    jp: this.#jp,
                },
            };
        }
    }

    export const TypeGuard = Node.TagTypeGuard<Data, ScratchData>(
        TAG,
        VERSION,
        (sData) => {
            const sd = sData as ScratchData;
            return typeof sd[TAG] === "object" && sd[TAG].jp instanceof Joinpoint;
        },
    );

    export interface Data extends BaseNode.Data {
        [TAG]: {
            version: typeof VERSION;
        };
    }

    export interface ScratchData extends BaseNode.ScratchData {
        [TAG]: {
            /**
             * The joinpoint associated with this node.
             * The joinpoint is not serializable.
             */
            jp: Joinpoint;
        };
    }
}

export default ClavaNode;
