import { apiClient } from "./apiClient";

export interface Tournament {
  TournamentID: number;
  TournamentCode: string;
  TournamentName: string;
  Description?: string;
  StartDate: string;
  EndDate: string;
  RegistrationStart: string;
  RegistrationEnd: string;
  Location: string;
  OrganizerName: string;
  Status: string;
  Rules?: string;
  CreatedAt: string;
}

export interface TournamentDivision {
  DivisionID: number;
  TournamentID: number;
  DivisionName: string;
  MinAge?: number;
  MaxAge?: number;
  MinDUPR?: number;
  MaxDUPR?: number;
  GenderRequirement: string;
  AgeGroup: string;
  CompetitionFormat: string;
  BracketType: string;
  RegistrationFee: number;
  MaxTeams: number;
  Status: string;
}

const getHeaders = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("pickleclub_token");
    return { token };
  }
  return {};
};

export const tournamentApi = {
  getTournaments: async () => {
    const res = await apiClient<{ data: Tournament[] }>("/api/tournaments");
    return res.data;
  },

  getTournamentDetail: async (id: number) => {
    const res = await apiClient<{ data: Tournament }>(`/api/tournaments/${id}`);
    return res.data;
  },

  createTournament: async (data: any) => {
    return apiClient<any>("/api/tournaments", {
      method: "POST",
      body: data,
      ...getHeaders(),
    });
  },

  updateTournament: async (id: number, data: any) => {
    return apiClient<any>(`/api/tournaments/${id}`, {
      method: "PUT",
      body: data,
      ...getHeaders(),
    });
  },

  publishTournament: async (id: number) => {
    return apiClient<any>(`/api/tournaments/${id}/publish`, {
      method: "POST",
      ...getHeaders(),
    });
  },

  closeRegistration: async (id: number) => {
    return apiClient<any>(`/api/tournaments/${id}/close-registration`, {
      method: "POST",
      ...getHeaders(),
    });
  },

  cancelTournament: async (id: number) => {
    return apiClient<any>(`/api/tournaments/${id}/cancel`, {
      method: "POST",
      ...getHeaders(),
    });
  },

  getDivisions: async (tournamentId: number) => {
    const res = await apiClient<{ data: TournamentDivision[] }>(`/api/tournaments/${tournamentId}/divisions`);
    return res.data;
  },

  createDivision: async (tournamentId: number, data: any) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/divisions`, {
      method: "POST",
      body: data,
      ...getHeaders(),
    });
  },

  updateDivision: async (tournamentId: number, divisionId: number, data: any) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/divisions/${divisionId}`, {
      method: "PUT",
      body: data,
      ...getHeaders(),
    });
  },

  registerSingles: async (tournamentId: number, divisionId: number, data: any) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/divisions/${divisionId}/register-singles`, {
      method: "POST",
      body: data,
      ...getHeaders(),
    });
  },

  registerDoubles: async (tournamentId: number, divisionId: number, data: any) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/divisions/${divisionId}/register-doubles`, {
      method: "POST",
      body: data,
      ...getHeaders(),
    });
  },

  respondInvitation: async (invitationId: number, action: "Accepted" | "Declined") => {
    return apiClient<any>(`/api/tournament-team-invitations/${invitationId}/respond`, {
      method: "POST",
      body: { action },
      ...getHeaders(),
    });
  },

  getSuggestedPartners: async (tournamentId: number, divisionId: number) => {
    const res = await apiClient<{ data: any[] }>(`/api/tournaments/${tournamentId}/divisions/${divisionId}/suggested-partners`, {
      ...getHeaders(),
    });
    return res.data;
  },

  createPayment: async (registrationId: number, paymentMethod: string) => {
    const res = await apiClient<{ data: any }>("/api/tournament-payments/create", {
      method: "POST",
      body: { registrationId, paymentMethod },
      ...getHeaders(),
    });
    return res.data;
  },

  generateBracket: async (tournamentId: number, divisionId: number) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/divisions/${divisionId}/generate-bracket`, {
      method: "POST",
      ...getHeaders(),
    });
  },

  generateSchedule: async (tournamentId: number, divisionId: number) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/divisions/${divisionId}/generate-schedule`, {
      method: "POST",
      ...getHeaders(),
    });
  },

  generateGroups: async (tournamentId: number, divisionId: number, groupCount: number) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/divisions/${divisionId}/generate-groups`, {
      method: "POST",
      body: { groupCount },
      ...getHeaders(),
    });
  },

  generateKnockout: async (tournamentId: number, divisionId: number) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/divisions/${divisionId}/generate-knockout`, {
      method: "POST",
      ...getHeaders(),
    });
  },


  allocateSchedule: async (tournamentId: number, divisionId: number, data: { courtIds: number[]; startDateTime: string; matchDurationMinutes: number; breakMinutes: number; dailyStartHour?: string; dailyEndHour?: string }) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/divisions/${divisionId}/allocate-schedule`, {
      method: "POST",
      body: data,
      ...getHeaders(),
    });
  },

  getMatches: async (tournamentId: number, divisionId: number) => {
    const res = await apiClient<{ data: any[] }>(`/api/tournaments/${tournamentId}/divisions/${divisionId}/matches`, {
      ...getHeaders(),
    });
    return res.data;
  },

  deleteSchedule: async (tournamentId: number, divisionId: number) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/divisions/${divisionId}/matches`, {
      method: "DELETE",
      ...getHeaders(),
    });
  },

  getStandings: async (tournamentId: number, divisionId: number) => {
    const res = await apiClient<{ data: any[] }>(`/api/tournaments/${tournamentId}/divisions/${divisionId}/standings`, {
      ...getHeaders(),
    });
    return res.data;
  },

  reportMatchScore: async (tournamentId: number, matchId: number, data: { sets: Array<{ setNo: number; teamAScore: number; teamBScore: number }>; adminOverride?: boolean }) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/matches/${matchId}/score`, {
      method: "POST",
      body: data,
      ...getHeaders(),
    });
  },

  setMatchReady: async (tournamentId: number, matchId: number) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/matches/${matchId}/ready`, {
      method: "POST",
      ...getHeaders(),
    });
  },

  startMatch: async (tournamentId: number, matchId: number) => {
    return apiClient<any>(`/api/tournaments/${tournamentId}/matches/${matchId}/start`, {
      method: "POST",
      ...getHeaders(),
    });
  },

  getRegistrations: async (tournamentId: number, divisionId: number) => {
    const res = await apiClient<{ data: any[] }>(`/api/tournaments/${tournamentId}/divisions/${divisionId}/registrations`, {
      ...getHeaders(),
    });
    return res.data;
  },

  getMyRegistration: async (tournamentId: number) => {
    const res = await apiClient<{ data: any }>(`/api/tournaments/${tournamentId}/my-registration`, {
      ...getHeaders(),
    });
    return res.data;
  },

  updateRegistrationAction: async (registrationId: number, action: "verify" | "checkin" | "reject", value?: boolean | string) => {
    return apiClient<any>(`/api/tournament-registrations/${registrationId}/action`, {
      method: "POST",
      body: { action, value },
      ...getHeaders(),
    });
  },
};
