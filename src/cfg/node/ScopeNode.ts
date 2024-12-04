import ClavaControlFlowNode from "@specs-feup/clava-flow/ClavaControlFlowNode";
import ClavaNode from "@specs-feup/clava-flow/ClavaNode";
import { Scope } from "@specs-feup/clava/api/Joinpoints.js";
import ControlFlowNode from "@specs-feup/flow/flow/ControlFlowNode";
import FunctionNode from "@specs-feup/flow/flow/FunctionNode";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import Node from "@specs-feup/flow/graph/Node";

namespace ScopeNode {
    export const TAG = "__clava_flow__scope_node";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends ClavaControlFlowNode.Class<D, S> {
        get isScopeStart(): boolean {
            return this.data[TAG].direction === Direction.ENTERING;
        }

        get isScopeEnd(): boolean {
            return this.data[TAG].direction === Direction.EXITING;
        }

        get isFlowNormal(): boolean {
            return this.data[TAG].controlFlowKind === ControlFlowKind.NORMAL;
        }

        get isFlowJump(): boolean {
            return this.data[TAG].controlFlowKind === ControlFlowKind.JUMP;
        }

        override get jp(): Scope {
            return this.scratchData[ClavaNode.TAG].jp;
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
        #jp: Scope;
        #direction: Direction;
        #controlFlowKind: ControlFlowKind;
        #clavaNodeBuilder: ClavaNode.Builder;

        constructor(
            jp: Scope,
            direction: Direction,
            controlFlowKind: ControlFlowKind = ControlFlowKind.NORMAL,
        ) {
            this.#jp = jp;
            this.#direction = direction;
            this.#controlFlowKind = controlFlowKind;
            this.#clavaNodeBuilder = new ClavaNode.Builder(this.#jp);
        }

        buildData(data: ControlFlowNode.Data): Data {
            return {
                ...data,
                ...this.#clavaNodeBuilder.buildData(data),
                [TAG]: {
                    version: VERSION,
                    direction: this.#direction,
                    controlFlowKind: this.#controlFlowKind,
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
                sData[ClavaNode.TAG].jp instanceof Scope
            );
        },
    );

    export interface Data extends ClavaControlFlowNode.Data {
        [TAG]: {
            version: typeof VERSION;
            direction: Direction;
            controlFlowKind: ControlFlowKind;
        };
    }

    export interface ScratchData extends ClavaControlFlowNode.ScratchData {
        [ClavaNode.TAG]: {
            jp: Scope;
        };
    }

    /**
     * Whether the node refers to the start or end of a scope.
     */
    export enum Direction {
        /**
         * The node refers to the start of a scope.
         */
        ENTERING = "ENTERING",
        /**
         * The node refers to the end of a scope.
         */
        EXITING = "EXITING",
    }

    /**
     * The context of the flow in which the scope node is located.
     */
    export enum ControlFlowKind {
        /**
         * The scope is part of the normal control flow of the program
         * (i.e. the next line of code to be executed was a '{' or '}').
         */
        NORMAL = "NORMAL",
        /**
         * The scope is part of a control flow jump statement (i.e. a 'goto', 'continue',
         * 'break', 'return') which enters or leaves a scope in the middle of it.
         *
         * Knowing this is useful, because it means that inserting a statement before
         * this node in the CFG does not correspond to inserting a statement before
         * the scope joinpoint in the AST.
         */
        JUMP = "JUMP",
    }
}

export default ScopeNode;
