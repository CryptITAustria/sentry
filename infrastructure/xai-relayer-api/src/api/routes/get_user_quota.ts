import { app } from "@/app";
import { getUserQuota } from "@/services/quota/getUserQuota";
import { Request, Response } from "express";
// import { getUserQuota } from "@/services/quota/getUserQuota";

/**
 * @swagger
 * /user/{relayerId}:
 *   get:
 *     description: Get the current quota for a user within a project
 *     relayerId: getUserQuota
 *     tags:
 *       - Quota
 *     parameters:
 *       - in: path
 *         name: relayerId
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

app.get('/userquota/:relayerId/:walletAddress', async (req: Request, res: Response) => {
    try {
        let relayerId = req.params.relayerId;
        let walletAddress = req.params.walletAddress;
        
        const userQuota = await getUserQuota(walletAddress, relayerId);
    
        return res.status(200).send({
            userQuota
        })

    } catch (error: any) {
        return res.status(501).send({
            message: `${error}`
        })
    }
});