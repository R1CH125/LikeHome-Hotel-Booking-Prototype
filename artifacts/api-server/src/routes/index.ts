import { Router, type IRouter } from "express";
import healthRouter from "./health";
import likehomeRouter from "./likehome";

const router: IRouter = Router();

router.use(healthRouter);
router.use(likehomeRouter);

export default router;
