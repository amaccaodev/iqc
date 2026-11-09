import { useEffect, useMemo, useState } from "react";
import type {
  Machine,
  MachineFilterOptions,
  MachineIncident,
  MachineStatus,
  MachineType,
  MaintenanceRecord,
  WorkshopType,
} from "../types/machine";
import {
  isMaintenanceUrgent,
  loadMachinesData,
  resetMachinesData,
  saveMachinesData,
} from "../services/machineStorage";
import { useAuth } from "./useAuth";

export function useMachineManagement() {
  const { user } = useAuth();
  const userRole = user?.role || "director";
  const canEdit = ["director", "admin", "mechanic", "supervisor"].includes(userRole);

  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [filters, setFilters] = useState<MachineFilterOptions>({
    search: "",
    workshop: "all",
    type: "all",
    status: "all",
  });

  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [statusModalMachine, setStatusModalMachine] = useState<Machine | null>(null);
  const [incidentModalMachine, setIncidentModalMachine] = useState<Machine | null>(null);
  const [maintenanceModalMachine, setMaintenanceModalMachine] = useState<Machine | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMachines(loadMachinesData());
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const workshops = useMemo<WorkshopType[]>(
    () => Array.from(new Set(machines.map((m) => m.workshop))),
    [machines],
  );

  const machineTypes = useMemo<MachineType[]>(
    () => Array.from(new Set(machines.map((m) => m.type))),
    [machines],
  );

  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      if (filters.status === "urgent") {
        const isUrgent = m.status === "broken" || isMaintenanceUrgent(m.nextMaintenanceDate);
        if (!isUrgent) return false;
      } else if (filters.status !== "all" && m.status !== filters.status) {
        return false;
      }

      if (filters.workshop !== "all" && m.workshop !== filters.workshop) {
        return false;
      }

      if (filters.type !== "all" && m.type !== filters.type) {
        return false;
      }

      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        return (
          m.code.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          (m.currentOrder || "").toLowerCase().includes(q) ||
          (m.operator || "").toLowerCase().includes(q) ||
          m.workshop.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [machines, filters]);

  const handleSaveMachine = (data: Partial<Machine>) => {
    let nextList: Machine[];
    if (editingMachine) {
      nextList = machines.map((m) =>
        m.id === editingMachine.id ? { ...m, ...data } : m,
      );
    } else {
      const newMachine: Machine = {
        id: `MC-${String(machines.length + 1).padStart(3, "0")}`,
        code: data.code || `MC-${machines.length + 1}`,
        name: data.name || "Máy mới",
        type: data.type || "Phay CNC",
        workshop: data.workshop || "Xưởng Cơ khí 1",
        line: data.line || "Dây chuyền 1",
        status: "idle",
        totalRunHours: 0,
        lastMaintenanceDate: new Date().toISOString().slice(0, 10),
        nextMaintenanceDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        model: data.model || "",
        brand: data.brand || "",
        manufacturerCountry: "Việt Nam",
        yearOfManufacture: new Date().getFullYear(),
        yearCommissioned: new Date().getFullYear(),
        powerKw: data.powerKw || 15,
        weightKg: data.weightKg || 3000,
        dimensionsMm: data.dimensionsMm || "2000 x 1800 x 2000",
        ipAddress: data.ipAddress,
        dailyStats: [],
        workHistory: [],
        maintenanceRecords: [],
        incidents: [],
      };
      nextList = [newMachine, ...machines];
    }
    setMachines(nextList);
    saveMachinesData(nextList);
    if (selectedMachine && editingMachine && selectedMachine.id === editingMachine.id) {
      setSelectedMachine({ ...selectedMachine, ...data });
    }
  };

  const handleConfirmChangeStatus = (
    machineId: string,
    newStatus: MachineStatus,
    orderNo?: string,
    progress?: number,
  ) => {
    const nextList = machines.map((m) => {
      if (m.id === machineId) {
        return {
          ...m,
          status: newStatus,
          currentOrder: orderNo !== undefined ? orderNo : newStatus === "running" ? m.currentOrder : undefined,
          progress: progress !== undefined ? progress : newStatus === "running" ? m.progress : undefined,
        };
      }
      return m;
    });
    setMachines(nextList);
    saveMachinesData(nextList);
    if (selectedMachine?.id === machineId) {
      const updated = nextList.find((m) => m.id === machineId);
      if (updated) setSelectedMachine(updated);
    }
  };

  const handleReportIncident = (incidentData: Partial<MachineIncident>) => {
    const newInc: MachineIncident = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      machineId: incidentData.machineId!,
      reportedAt: incidentData.reportedAt || new Date().toISOString(),
      downtimeMinutes: 0,
      severity: incidentData.severity || "high",
      description: incidentData.description || "",
      technician: incidentData.technician,
      status: "pending",
    };

    const nextList = machines.map((m) => {
      if (m.id === incidentData.machineId) {
        return {
          ...m,
          status: "broken" as MachineStatus,
          incidents: [newInc, ...(m.incidents || [])],
        };
      }
      return m;
    });
    setMachines(nextList);
    saveMachinesData(nextList);
    if (selectedMachine?.id === incidentData.machineId) {
      const updated = nextList.find((m) => m.id === incidentData.machineId);
      if (updated) setSelectedMachine(updated);
    }
  };

  const handleScheduleMaintenance = (recordData: Partial<MaintenanceRecord>) => {
    const newRecord: MaintenanceRecord = {
      id: `MT-${Date.now().toString().slice(-4)}`,
      machineId: recordData.machineId!,
      date: recordData.date || new Date().toISOString().slice(0, 10),
      type: recordData.type || "periodic",
      description: recordData.description || "",
      technician: recordData.technician || "KTV",
      costVnd: recordData.costVnd || 0,
      status: "scheduled",
    };

    const nextList = machines.map((m) => {
      if (m.id === recordData.machineId) {
        return {
          ...m,
          nextMaintenanceDate: recordData.date || m.nextMaintenanceDate,
          maintenanceRecords: [newRecord, ...(m.maintenanceRecords || [])],
        };
      }
      return m;
    });
    setMachines(nextList);
    saveMachinesData(nextList);
    if (selectedMachine?.id === recordData.machineId) {
      const updated = nextList.find((m) => m.id === recordData.machineId);
      if (updated) setSelectedMachine(updated);
    }
  };

  const handleResetDemo = () => {
    if (confirm("Khôi phục toàn bộ danh sách máy về dữ liệu mẫu 12 máy ban đầu?")) {
      const initial = resetMachinesData();
      setMachines(initial);
      setSelectedMachine(null);
    }
  };

  return {
    canEdit,
    machines,
    loading,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    filteredMachines,
    workshops,
    machineTypes,
    selectedMachine,
    setSelectedMachine,
    isAddEditModalOpen,
    setIsAddEditModalOpen,
    editingMachine,
    setEditingMachine,
    statusModalMachine,
    setStatusModalMachine,
    incidentModalMachine,
    setIncidentModalMachine,
    maintenanceModalMachine,
    setMaintenanceModalMachine,
    handleSaveMachine,
    handleConfirmChangeStatus,
    handleReportIncident,
    handleScheduleMaintenance,
    handleResetDemo,
  };
}

