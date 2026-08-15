import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DropTables {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/civicpulse_db";
        String user = "postgres";
        String password = "civic@12";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("Dropping service_applications...");
            stmt.executeUpdate("DROP TABLE IF EXISTS service_applications CASCADE");
            System.out.println("Dropped service_applications.");

            System.out.println("Dropping application_history...");
            stmt.executeUpdate("DROP TABLE IF EXISTS application_history CASCADE");
            System.out.println("Dropped application_history.");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
