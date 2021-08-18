import { Parser, Ast } from 'shape-path-core';
import * as ShexCParser from '@shexjs/parser';
import * as ShExUtil from '@shexjs/util';
import { shapePathQuery } from '@shexjs/shape-path-query';
import { DatasetCore } from '@rdfjs/types';

export async function findChildReferences(
  parentIri: string,
  parentDataset: DatasetCore,
  parentShapeIri: string,
  parentShapeText: string,
  shapePath: string
): Promise<string[]> {
  const shexParser = ShexCParser.construct();
  const schema = shexParser.parse(parentShapeText);
  const pathExpr = new Parser.ShapePathParser().parse(shapePath);
  const schemaNodes = pathExpr.evalPathExpr([schema], new Ast.EvalContext(schema));
  const db = ShExUtil.rdfjsDB(parentDataset);
  return shapePathQuery(schema, schemaNodes, db, [{ node: parentIri, shape: parentShapeIri }]);
}
