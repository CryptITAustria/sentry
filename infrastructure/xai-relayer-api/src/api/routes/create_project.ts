import { app } from "@/app";
import { loadMongoose } from "@/loaders/mongoose";
import ProjectModel from "@/models/Project.schema";
import { NextFunction, Request, Response } from "express";

/**
 * @swagger
 * /quota/{projectId}:
 *   get:
 *     description: Get the current quota for a project
 *     operationId: getProjectQuota
 *     tags:
 *       - Quota
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

app.get('/project/create', async (req: Request, res: Response, next: NextFunction) => {

    //TODO admin auth !

    try {
        await loadMongoose();
        const found = await ProjectModel.exists({ name: "Test SSA 1" });

        if (found) {
            return res.status(200).send({
                message: "Found",
                projectId: found._id
            });
        }

        const newProject = new ProjectModel({
            name: "Test SSA 1",
            forwarderAddress: "0x61f97dff786d5739109bA1B6cD3854c21B7378Ee",
            relayerId: "b64f2499-a16f-48cd-b988-f309eb31f91c",
            backendWallet: "0xAa51D96140b3708Df31b4878c78f9924a0CC7d7D",
            lastRefillTimestamp: Date.now(),
            refillInterval: 30 * 60 * 1000,
            projectLimitWei: (1 * 10 ** 17).toString(),
            projectBalanceWei: (1 * 10 ** 17).toString(),
            userLimitWei: (1 * 10 ** 16).toString(),
            userRefillInterval: 30 * 60 * 1000,
        });

        await newProject.save();

        return res.status(200).send({
            message: "Saved",
            projectId: newProject._id
        });
    } catch (error) {
        next(error);
    }

});