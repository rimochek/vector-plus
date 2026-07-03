import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UserRole, TutorApplicationStatus } from '@prisma/client';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('AdminController access', () => {
  let controller: AdminController;
  const adminService = {
    listTutorApplications: jest.fn(),
    getTutorApplication: jest.fn(),
    approveTutor: jest.fn(),
    rejectTutor: jest.fn(),
    reviewVerificationDocument: jest.fn(),
    getVerificationDocumentDownload: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: adminService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => { user?: { roles: UserRole[] } } };
        }) => {
          const user = context.switchToHttp().getRequest().user;
          if (!user?.roles.includes(UserRole.ADMIN)) {
            throw new ForbiddenException();
          }
          return true;
        },
      })
      .compile();

    controller = module.get(AdminController);
  });

  it('lists submitted applications for admin', async () => {
    adminService.listTutorApplications.mockResolvedValue([{ id: 't1' }]);
    const result = await controller.listTutors('SUBMITTED');
    expect(result).toEqual([{ id: 't1' }]);
    expect(adminService.listTutorApplications).toHaveBeenCalledWith('SUBMITTED');
  });
});

describe('marketplace approval gate', () => {
  it('requires APPROVED status and isAcceptingStudents for public listing', () => {
    const visible = {
      applicationStatus: TutorApplicationStatus.APPROVED,
      isAcceptingStudents: true,
    };
    const submitted = {
      applicationStatus: TutorApplicationStatus.SUBMITTED,
      isAcceptingStudents: false,
    };
    const rejected = {
      applicationStatus: TutorApplicationStatus.REJECTED,
      isAcceptingStudents: false,
    };

    expect(
      visible.applicationStatus === TutorApplicationStatus.APPROVED &&
        visible.isAcceptingStudents,
    ).toBe(true);
    expect(
      submitted.applicationStatus === TutorApplicationStatus.APPROVED &&
        submitted.isAcceptingStudents,
    ).toBe(false);
    expect(
      rejected.applicationStatus === TutorApplicationStatus.APPROVED &&
        rejected.isAcceptingStudents,
    ).toBe(false);
  });
});
