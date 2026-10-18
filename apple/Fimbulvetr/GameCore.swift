import Foundation
import JavaScriptCore

/// The game rules: `fimbulvetr-core.js` (`pnpm port:build`, see src/port) running in JavaScriptCore.
/// Everything crosses the bridge as strings and numbers.
final class GameCore {
    struct Status: Decodable {
        struct Hero: Decodable { let x: Double; let y: Double; let hp: Int }
        let screen: String
        let mode: String
        let hero: Hero
    }

    private let context: JSContext
    private let port: JSValue

    init(seed: Int) throws {
        guard let url = Bundle.main.url(forResource: "fimbulvetr-core", withExtension: "js", subdirectory: "Resources"),
              let source = try? String(contentsOf: url, encoding: .utf8)
        else { throw CoreError.missing("fimbulvetr-core.js") }
        let context: JSContext = JSContext()
        context.exceptionHandler = { _, exception in
            print("[core] \(exception?.toString() ?? "unknown error")")
        }
        context.evaluateScript(source)
        guard let core = context.objectForKeyedSubscript("FimbulvetrCore"), !core.isUndefined,
              let port = core.invokeMethod("createPort", withArguments: [])
        else { throw CoreError.missing("FimbulvetrCore") }
        self.context = context
        self.port = port
        let error = port.invokeMethod("boot", withArguments: [NSNull(), seed])?.toString() ?? "no answer"
        if !error.isEmpty { throw CoreError.boot(error) }
    }

    /// One 1/60 s tick. Returns the tick's events as JSON, or "" when there were none.
    @discardableResult
    func step(held: Int, mx: Double, my: Double) -> String {
        port.invokeMethod("step", withArguments: [held, mx, my])?.toString() ?? ""
    }

    func status() -> Status? {
        guard let json = port.invokeMethod("status", withArguments: [])?.toString() else { return nil }
        return try? JSONDecoder().decode(Status.self, from: Data(json.utf8))
    }

    enum CoreError: Error {
        case missing(String)
        case boot(String)
    }
}
