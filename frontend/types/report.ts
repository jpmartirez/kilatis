import { StoredResultItem } from "./results";

export interface ReportCaseData {
	caseNumber: string;
	caseTitle?: string;
	caseDate?: string;
	caseTime?: string;
	caseLocation?: string;
	investigatorName: string;
	caseNotes?: string;
	analyzedAt: string;
	items: StoredResultItem[];
	summary?: {
		totalItems: number;
		splicedCount: number;
		aiCount: number;
		authenticCount: number;
		reviewCount: number;
	};
}

export interface ReportImageMetadata {
	fileName: string;
	fileSize: string;
	fileType: string;
	dimensions: string;
	sha256: string;
	cameraMake: string;
	cameraModel: string;
	software: string;
	dateCreated: string;
	gpsCoordinates: string;
	colorSpace: string;
	compression: string;
}
