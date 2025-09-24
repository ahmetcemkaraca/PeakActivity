import { db } from '../firebaseAdmin';

interface ProjectDocument {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'cancelled';
  start_date: number;
  due_date?: number;
  completion_date?: number;
  total_tracked_duration: number;
  estimated_remaining_duration?: number;
  progress_percentage: number;
  associated_goals?: string[];
  associated_tasks?: string[];
  activity_breakdown?: { [category: string]: number };
  focus_score_average?: number;
  created_at: number;
  updated_at: number;
  version: number;
}

export class ProjectPredictionService {
  private db: any;

  constructor() {
    this.db = db;
  }

  /**
   * Creates a new project document in Firestore.
   * @param userId The ID of the user creating the project.
   * @param projectData The initial project data.
   * @returns The created ProjectDocument.
   */
  async createProject(
    userId: string,
    projectData: Partial<ProjectDocument>
  ): Promise<ProjectDocument> {
    const projectRef = this.db.collection(`users/${userId}/projects`).doc();
    const newProject: ProjectDocument = {
      id: projectRef.id,
      user_id: userId,
      title: projectData.title || 'New Project',
      status: projectData.status || 'active',
      start_date: projectData.start_date || Date.now(),
      total_tracked_duration: projectData.total_tracked_duration || 0,
      progress_percentage: projectData.progress_percentage || 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      version: 1,
      ...projectData, // Overwrite defaults with provided data
    };
    await projectRef.set(newProject);
    return newProject;
  }

  /**
   * Retrieves a project document by its ID.
   * @param userId The ID of the user who owns the project.
   * @param projectId The ID of the project to retrieve.
   * @returns The ProjectDocument, or null if not found.
   */
  async getProject(userId: string, projectId: string): Promise<ProjectDocument | null> {
    const projectDoc = await this.db.collection(`users/${userId}/projects`).doc(projectId).get();
    if (projectDoc.exists) {
      return projectDoc.data() as ProjectDocument;
    }
    return null;
  }

  /**
   * Updates an existing project document.
   * @param userId The ID of the user who owns the project.
   * @param projectId The ID of the project to update.
   * @param updates The fields to update.
   * @returns The updated ProjectDocument, or null if the project was not found.
   */
  async updateProject(
    userId: string,
    projectId: string,
    updates: Partial<ProjectDocument>
  ): Promise<ProjectDocument | null> {
    const projectRef = this.db.collection(`users/${userId}/projects`).doc(projectId);
    await projectRef.update({
      ...updates,
      updated_at: Date.now(),
    });
    return this.getProject(userId, projectId);
  }

  /**
   * Retrieves all projects for a given user.
   * @param userId The ID of the user.
   * @returns An array of ProjectDocument.
   */
  async getAllProjects(userId: string): Promise<ProjectDocument[]> {
    const projectsSnapshot = await this.db.collection(`users/${userId}/projects`).get();
    return projectsSnapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as ProjectDocument
    );
  }

  /**
   * Deletes a project document.
   * @param userId The ID of the user who owns the project.
   * @param projectId The ID of the project to delete.
   */
  async deleteProject(userId: string, projectId: string): Promise<void> {
    await this.db.collection(`users/${userId}/projects`).doc(projectId).delete();
  }
}
