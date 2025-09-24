import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ProjectPredictionService } from '../services/project-prediction-service';
import { requireSubscription } from '../middlewares/requireAuth'; // requireSubscription'ı import et

const projectPredictionService = new ProjectPredictionService();

// Create Project API
export const createProject = onCall(
  requireSubscription('premium')(async request => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const userId = request.auth.uid;
    const { title, description, status, start_date, due_date, associated_goals, associated_tasks } =
      request.data;

    if (typeof title !== 'string' || title.trim() === '') {
      throw new HttpsError('invalid-argument', 'Project title is required.');
    }

    try {
      const newProject = await projectPredictionService.createProject(userId, {
        title,
        description,
        status,
        start_date,
        due_date,
        associated_goals,
        associated_tasks,
      });
      return { status: 'success', data: newProject };
    } catch (error: any) {
      throw new HttpsError('internal', error.message || 'Failed to create project.');
    }
  })
);

// Get Project API
export const getProject = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { projectId } = request.data;

  if (typeof projectId !== 'string' || projectId.trim() === '') {
    throw new HttpsError('invalid-argument', 'Project ID is required.');
  }

  try {
    const project = await projectPredictionService.getProject(userId, projectId);
    if (!project) {
      throw new HttpsError('not-found', 'Project not found.');
    }
    return { status: 'success', data: project };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'Failed to get project.');
  }
});

// Update Project API
export const updateProject = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { projectId, updates } = request.data;

  if (typeof projectId !== 'string' || projectId.trim() === '') {
    throw new HttpsError('invalid-argument', 'Project ID is required.');
  }
  if (typeof updates !== 'object' || updates === null) {
    throw new HttpsError('invalid-argument', 'Updates object is required.');
  }

  try {
    const updatedProject = await projectPredictionService.updateProject(userId, projectId, updates);
    if (!updatedProject) {
      throw new HttpsError('not-found', 'Project not found.');
    }
    return { status: 'success', data: updatedProject };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'Failed to update project.');
  }
});

// Get All Projects API
export const getAllProjects = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;

  try {
    const projects = await projectPredictionService.getAllProjects(userId);
    return { status: 'success', data: projects };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'Failed to get all projects.');
  }
});

// Delete Project API
export const deleteProject = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { projectId } = request.data;

  if (typeof projectId !== 'string' || projectId.trim() === '') {
    throw new HttpsError('invalid-argument', 'Project ID is required.');
  }

  try {
    await projectPredictionService.deleteProject(userId, projectId);
    return { status: 'success' };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'Failed to delete project.');
  }
});
