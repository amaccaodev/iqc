import type { Request, Response } from "express";
import { BaseController } from "../core/BaseController.js";
import type { OrderService } from "../services/OrderService.js";

export class OrderController extends BaseController {
  constructor(private readonly orderService: OrderService) {
    super();
  }

  list = (_req: Request, res: Response): void => {
    void this.handle(res, () => this.orderService.getAll());
  };

  getById = (req: Request, res: Response): void => {
    void this.handle(res, () => {
      const order = this.orderService.getById(this.param(req.params.id));
      if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
      return order;
    });
  };

  create = (req: Request, res: Response): void => {
    void this.handle(res, () => this.orderService.createOrder(req.body), 201);
  };

  addAttachment = (req: Request, res: Response): void => {
    void this.handle(res, () => this.orderService.addAttachment(this.param(req.params.id), req.body));
  };

  addBOM = (req: Request, res: Response): void => {
    void this.handle(res, () => this.orderService.addBOM(this.param(req.params.id), req.body));
  };

  assignBOM = (req: Request, res: Response): void => {
    void this.handle(res, () =>
      this.orderService.assignBOM(this.param(req.params.orderId), this.param(req.params.bomId), req.body.teamId),
    );
  };

  assignWorkers = (req: Request, res: Response): void => {
    void this.handle(res, () =>
      this.orderService.assignWorkers(
        this.param(req.params.orderId),
        this.param(req.params.bomId),
        req.body.workerNames ?? [],
      ),
    );
  };

  approve = (req: Request, res: Response): void => {
    void this.handle(res, () => this.orderService.approveOrder(this.param(req.params.id)));
  };

  reject = (req: Request, res: Response): void => {
    void this.handle(res, () => this.orderService.rejectOrder(this.param(req.params.id)));
  };

  teamReport = (req: Request, res: Response): void => {
    void this.handle(res, () =>
      this.orderService.submitTeamReport(this.param(req.params.orderId), this.param(req.params.bomId), req.body),
    );
  };

  workerEntry = (req: Request, res: Response): void => {
    void this.handle(res, () =>
      this.orderService.submitWorkerEntry(this.param(req.params.orderId), this.param(req.params.bomId), req.body),
    );
  };

  workerRow = (req: Request, res: Response): void => {
    void this.handle(res, () =>
      this.orderService.submitWorkerRow(
        this.param(req.params.orderId),
        this.param(req.params.bomId),
        req.body,
      ),
    );
  };

  qcReport = (req: Request, res: Response): void => {
    void this.handle(res, () =>
      this.orderService.submitQCReport(
        this.param(req.params.orderId),
        this.param(req.params.bomId),
        req.body.report,
        req.body.passed,
      ),
    );
  };

  stats = (_req: Request, res: Response): void => {
    void this.handle(res, () => this.orderService.getStats());
  };
}
