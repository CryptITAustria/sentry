import { app } from "@/app";
import { Request, Response } from "express";

/**
 * @swagger
 * /forward/{projectId}:
 *   get:
 *     description: Forward a Transaction to a Relayer
 *     operationId: forwardMetaTransaction
 *     tags:
 *       - MetaTransaction
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenSaleInfo'
 *       '500':
 *         $ref: '#/components/responses/APIError'
 */
//TODO swagger docs return types !

app.get('/forward/:projectId', (req: Request, res: Response) => {
    //TODO handle porjectId to get correct contract addresses
    return res.status(200).send({
        message: "Not Implemented",
        projectId: req.params.projectId
    });
});