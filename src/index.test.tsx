import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { useForm, Controller, z, zodResolver } from './index';
import React from 'react';

describe('Form Validation Module', () => {
  describe('Exports', () => {
    it('exports useForm from react-hook-form', () => {
      expect(useForm).toBeDefined();
      expect(typeof useForm).toBe('function');
    });

    it('exports Controller from react-hook-form', () => {
      expect(Controller).toBeDefined();
      expect(['object', 'function']).toContain(typeof Controller);
    });

    it('exports z from zod', () => {
      expect(z).toBeDefined();
      expect(typeof z).toBe('object');
    });

    it('exports zodResolver from @hookform/resolvers/zod', () => {
      expect(zodResolver).toBeDefined();
      expect(typeof zodResolver).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('creates a simple form with validation using useForm and zod', () => {
      // Define a schema with zod
      const schema = z.object({
        email: z.string().email('Invalid email'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
      });

      type FormData = z.infer<typeof schema>;

      // Create a test component
      const TestForm: React.FC = () => {
        const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
          resolver: zodResolver(schema),
        });

        const onSubmit = (data: FormData) => {
          console.log(data);
        };

        return (
          <form onSubmit={handleSubmit(onSubmit)}>
            <input {...register('email')} data-testid="email" />
            {errors.email && <span data-testid="email-error">{errors.email.message}</span>}

            <input {...register('password')} data-testid="password" type="password" />
            {errors.password && <span data-testid="password-error">{errors.password.message}</span>}

            <button type="submit" data-testid="submit">Submit</button>
          </form>
        );
      };

      render(<TestForm />);

      // Elements should be rendered
      expect(screen.getByTestId('email')).toBeInTheDocument();
      expect(screen.getByTestId('password')).toBeInTheDocument();
      expect(screen.getByTestId('submit')).toBeInTheDocument();
    });

    it('validates form fields using zod schema', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
      });

      type FormData = z.infer<typeof schema>;

      const TestForm: React.FC = () => {
        const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
          resolver: zodResolver(schema),
        });

        return (
          <form onSubmit={handleSubmit(() => {})}>
            <input {...register('email')} data-testid="email" />
            {errors.email && <span data-testid="email-error">{errors.email.message}</span>}
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        );
      };

      render(<TestForm />);

      // Enter invalid email
      const emailInput = screen.getByTestId('email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(screen.getByTestId('submit'));

      // Error should appear
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email');
      });
    });

    it('passes validation with valid data', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
      });

      type FormData = z.infer<typeof schema>;

      const mockSubmit = jest.fn();

      const TestForm: React.FC = () => {
        const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
          resolver: zodResolver(schema),
        });

        return (
          <form onSubmit={handleSubmit(mockSubmit)}>
            <input {...register('email')} data-testid="email" />
            {errors.email && <span data-testid="email-error">{errors.email.message}</span>}
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        );
      };

      render(<TestForm />);

      // Enter valid email
      const emailInput = screen.getByTestId('email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByTestId('submit'));

      // Form should submit successfully
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          { email: 'test@example.com' },
          expect.anything()
        );
      });

      // No error should appear
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });

    it('works with Controller for custom inputs', () => {
      const schema = z.object({
        customField: z.string().min(3, 'Must be at least 3 characters'),
      });

      type FormData = z.infer<typeof schema>;

      const TestForm: React.FC = () => {
        const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
          resolver: zodResolver(schema),
        });

        return (
          <form onSubmit={handleSubmit(() => {})}>
            <Controller
              name="customField"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <input {...field} data-testid="custom-field" />
              )}
            />
            {errors.customField && (
              <span data-testid="custom-error">{errors.customField.message}</span>
            )}
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        );
      };

      render(<TestForm />);

      // Controller should render the custom input
      expect(screen.getByTestId('custom-field')).toBeInTheDocument();
    });

    it('validates multiple fields with complex schema', async () => {
      const schema = z.object({
        username: z.string().min(3, 'Username must be at least 3 characters'),
        email: z.string().email('Invalid email'),
        age: z.number().min(18, 'Must be at least 18'),
      });

      type FormData = z.infer<typeof schema>;

      const TestForm: React.FC = () => {
        const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
          resolver: zodResolver(schema),
        });

        return (
          <form onSubmit={handleSubmit(() => {})}>
            <input {...register('username')} data-testid="username" />
            {errors.username && <span data-testid="username-error">{errors.username.message}</span>}

            <input {...register('email')} data-testid="email" />
            {errors.email && <span data-testid="email-error">{errors.email.message}</span>}

            <input {...register('age', { valueAsNumber: true })} type="number" data-testid="age" />
            {errors.age && <span data-testid="age-error">{errors.age.message}</span>}

            <button type="submit" data-testid="submit">Submit</button>
          </form>
        );
      };

      render(<TestForm />);

      // Submit with invalid data
      fireEvent.change(screen.getByTestId('username'), { target: { value: 'ab' } });
      fireEvent.change(screen.getByTestId('email'), { target: { value: 'invalid' } });
      fireEvent.change(screen.getByTestId('age'), { target: { value: '15' } });
      fireEvent.click(screen.getByTestId('submit'));

      // Multiple errors should appear
      await waitFor(() => {
        expect(screen.getByTestId('username-error')).toHaveTextContent('Username must be at least 3 characters');
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email');
        expect(screen.getByTestId('age-error')).toHaveTextContent('Must be at least 18');
      });
    });

    it('supports optional fields with zod', async () => {
      const schema = z.object({
        required: z.string().min(1, 'Required'),
        optional: z.string().optional(),
      });

      type FormData = z.infer<typeof schema>;

      const mockSubmit = jest.fn();

      const TestForm: React.FC = () => {
        const { register, handleSubmit } = useForm<FormData>({
          resolver: zodResolver(schema),
        });

        return (
          <form onSubmit={handleSubmit(mockSubmit)}>
            <input {...register('required')} data-testid="required" />
            <input {...register('optional')} data-testid="optional" />
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        );
      };

      render(<TestForm />);

      // Submit with only required field filled
      fireEvent.change(screen.getByTestId('required'), { target: { value: 'value' } });
      fireEvent.click(screen.getByTestId('submit'));

      // Should submit successfully without optional field
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          { required: 'value', optional: '' },
          expect.anything()
        );
      });
    });

    it('validates with custom zod refinements', async () => {
      const schema = z.object({
        password: z.string().min(6),
        confirmPassword: z.string().min(6),
      }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });

      type FormData = z.infer<typeof schema>;

      const TestForm: React.FC = () => {
        const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
          resolver: zodResolver(schema),
        });

        return (
          <form onSubmit={handleSubmit(() => {})}>
            <input {...register('password')} type="password" data-testid="password" />
            <input {...register('confirmPassword')} type="password" data-testid="confirm-password" />
            {errors.confirmPassword && (
              <span data-testid="confirm-error">{errors.confirmPassword.message}</span>
            )}
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        );
      };

      render(<TestForm />);

      // Enter mismatched passwords
      fireEvent.change(screen.getByTestId('password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByTestId('confirm-password'), { target: { value: 'password456' } });
      fireEvent.click(screen.getByTestId('submit'));

      // Custom error should appear
      await waitFor(() => {
        expect(screen.getByTestId('confirm-error')).toHaveTextContent('Passwords do not match');
      });
    });
  });
});
