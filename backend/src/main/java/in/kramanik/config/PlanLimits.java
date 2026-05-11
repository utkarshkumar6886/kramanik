package in.kramanik.config;

import in.kramanik.model.Institute.Plan;
import org.springframework.stereotype.Component;

/**
 * Central source of truth for plan limits.
 * Change limits here — they propagate everywhere automatically.
 */
@Component
public class PlanLimits {

    public record Limits(int maxStudents, int maxBatches, boolean whatsappNotifications, boolean monthlyReports) {}

    public Limits forPlan(Plan plan) {
        return switch (plan) {
            case FREE  -> new Limits(30,  2,   false, false);
            case BASIC -> new Limits(100, 10,  true,  false);
            case PRO   -> new Limits(Integer.MAX_VALUE, Integer.MAX_VALUE, true, true);
        };
    }

    public boolean canAddStudent(Plan plan, long currentCount) {
        return currentCount < forPlan(plan).maxStudents();
    }

    public boolean canAddBatch(Plan plan, long currentCount) {
        return currentCount < forPlan(plan).maxBatches();
    }

    public String studentLimitMessage(Plan plan) {
        int max = forPlan(plan).maxStudents();
        return max == Integer.MAX_VALUE
            ? "No student limit on PRO plan."
            : String.format("Your %s plan allows up to %d students. Upgrade to add more.", plan, max);
    }

    public String batchLimitMessage(Plan plan) {
        int max = forPlan(plan).maxBatches();
        return max == Integer.MAX_VALUE
            ? "No batch limit on PRO plan."
            : String.format("Your %s plan allows up to %d batches. Upgrade to add more.", plan, max);
    }
}
