import { MoveTreeNode } from '../types/analysis';
import { ChessSquare, MoveHistoryItem, PieceColor, PieceType } from '../types/chess';
import { STARTING_FEN } from '../utils/chessUtils';

export class MoveTree {
  public rootId: string = 'root';
  public initialFen: string = STARTING_FEN;
  public nodes: Map<string, MoveTreeNode> = new Map();

  constructor(initialFen: string = STARTING_FEN) {
    this.initialFen = initialFen;
    this.reset(initialFen);
  }

  public reset(initialFen: string = STARTING_FEN) {
    this.initialFen = initialFen;
    this.nodes.clear();
    const rootNode: MoveTreeNode = {
      id: this.rootId,
      san: '',
      from: 'a1' as ChessSquare,
      to: 'a1' as ChessSquare,
      piece: 'k',
      color: 'w',
      fen: initialFen,
      moveNumber: 0,
      isCheck: false,
      isCheckmate: false,
      parentId: null,
      childrenIds: [],
      isMainline: true,
    };
    this.nodes.set(this.rootId, rootNode);
  }

  public getNode(id: string): MoveTreeNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Adds a move under the given parent node.
   * If a move with the exact same SAN already exists under parent, returns existing node ID.
   */
  public addMove(
    parentId: string,
    move: {
      san: string;
      from: ChessSquare;
      to: ChessSquare;
      piece: PieceType;
      color: PieceColor;
      captured?: PieceType;
      promotion?: PieceType;
      fen: string;
      moveNumber: number;
      isCheck: boolean;
      isCheckmate: boolean;
    }
  ): string {
    const parent = this.nodes.get(parentId);
    if (!parent) {
      throw new Error(`Parent node with ID "${parentId}" not found in MoveTree.`);
    }

    // Check if move already exists among children
    for (const childId of parent.childrenIds) {
      const child = this.nodes.get(childId);
      if (child && child.san === move.san) {
        return childId;
      }
    }

    // Create new node
    const isFirstChild = parent.childrenIds.length === 0;
    const isMainline = parent.isMainline && isFirstChild;
    const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newNode: MoveTreeNode = {
      ...move,
      id: newId,
      parentId,
      childrenIds: [],
      isMainline,
    };

    this.nodes.set(newId, newNode);
    parent.childrenIds.push(newId);

    return newId;
  }

  /**
   * Delete a node and all its descendants
   */
  public deleteNode(nodeId: string): boolean {
    if (nodeId === this.rootId) return false;
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Recursively delete all children
    const deleteSubtree = (id: string) => {
      const current = this.nodes.get(id);
      if (current) {
        current.childrenIds.forEach((childId) => deleteSubtree(childId));
        this.nodes.delete(id);
      }
    };

    // Remove from parent's childrenIds
    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.childrenIds = parent.childrenIds.filter((id) => id !== nodeId);
        // If the deleted node was mainline, promote the first remaining child to mainline
        if (node.isMainline && parent.childrenIds.length > 0) {
          this.promoteToMainline(parent.childrenIds[0]);
        }
      }
    }

    deleteSubtree(nodeId);
    return true;
  }

  /**
   * Promote a variation node to be the first child (main line) of its parent
   */
  public promoteToMainline(nodeId: string): boolean {
    if (nodeId === this.rootId) return false;
    let currentId = nodeId;

    while (currentId !== this.rootId) {
      const current = this.nodes.get(currentId);
      if (!current || !current.parentId) break;

      const parent = this.nodes.get(current.parentId);
      if (!parent) break;

      // Move currentId to index 0 of parent's childrenIds
      const filtered = parent.childrenIds.filter((id) => id !== currentId);
      parent.childrenIds = [currentId, ...filtered];

      // Update mainline flags for all children of this parent
      parent.childrenIds.forEach((childId, idx) => {
        const child = this.nodes.get(childId);
        if (child) {
          child.isMainline = parent.isMainline && idx === 0;
        }
      });

      currentId = current.parentId;
    }

    this.recomputeMainlineFlags();
    return true;
  }

  /**
   * Set commentary for a node
   */
  public setComment(nodeId: string, comment: string) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.comment = comment.trim() ? comment.trim() : undefined;
    }
  }

  /**
   * Recomputes all isMainline flags across the tree
   */
  private recomputeMainlineFlags() {
    const traverse = (nodeId: string, isParentMainline: boolean) => {
      const node = this.nodes.get(nodeId);
      if (!node) return;

      node.childrenIds.forEach((childId, index) => {
        const child = this.nodes.get(childId);
        if (child) {
          child.isMainline = isParentMainline && index === 0;
          traverse(childId, child.isMainline);
        }
      });
    };

    const root = this.nodes.get(this.rootId);
    if (root) {
      root.isMainline = true;
      traverse(this.rootId, true);
    }
  }

  /**
   * Returns array of nodes on the primary mainline
   */
  public getMainline(): MoveTreeNode[] {
    const mainline: MoveTreeNode[] = [];
    let currentId: string | null = this.rootId;

    while (currentId) {
      const node: MoveTreeNode | undefined = this.nodes.get(currentId);
      if (!node) break;
      if (node.id !== this.rootId) {
        mainline.push(node);
      }
      currentId = node.childrenIds.length > 0 ? node.childrenIds[0] : null;
    }

    return mainline;
  }

  /**
   * Returns path of node IDs from root to given node
   */
  public getPathToNode(nodeId: string): string[] {
    const path: string[] = [];
    let currentId: string | null = nodeId;

    while (currentId) {
      path.unshift(currentId);
      const node: MoveTreeNode | undefined = this.nodes.get(currentId);
      currentId = node ? node.parentId : null;
    }

    return path;
  }

  /**
   * Populate tree from an array of MoveHistoryItems
   */
  public loadFromHistory(history: MoveHistoryItem[], initialFen: string = STARTING_FEN) {
    this.reset(initialFen);
    let parentId = this.rootId;

    for (const item of history) {
      parentId = this.addMove(parentId, {
        san: item.san,
        from: item.from,
        to: item.to,
        piece: item.piece,
        color: item.color,
        captured: item.captured,
        promotion: item.promotion,
        fen: item.fen,
        moveNumber: item.moveNumber,
        isCheck: item.isCheck,
        isCheckmate: item.isCheckmate,
      });
    }
  }

  /**
   * Export tree structure to recursive PGN with variations and comments
   */
  public exportTreePGN(): string {
    const root = this.nodes.get(this.rootId);
    if (!root || root.childrenIds.length === 0) return '*';

    const renderNode = (nodeId: string, isFirstInBranch: boolean = false): string => {
      const node = this.nodes.get(nodeId);
      if (!node) return '';

      let text = '';
      if (node.color === 'w' || isFirstInBranch) {
        text += `${node.moveNumber}${node.color === 'w' ? '.' : '...'} `;
      }
      text += node.san;

      if (node.comment) {
        text += ` {${node.comment}}`;
      }

      // First child is continuation
      if (node.childrenIds.length > 0) {
        text += ' ' + renderNode(node.childrenIds[0], false);
      }

      // Remaining children are side variations
      for (let i = 1; i < node.childrenIds.length; i++) {
        text += ` (${renderNode(node.childrenIds[i], true)})`;
      }

      return text;
    };

    return renderNode(root.childrenIds[0], false).trim();
  }
}
